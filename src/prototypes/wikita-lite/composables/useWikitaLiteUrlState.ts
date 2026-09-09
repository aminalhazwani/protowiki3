import { computed, ref, watch, type Ref } from 'vue'
import { useRoute } from 'vue-router'

import { getMutableConfigRef } from '@/composables/useConfig'
import {
  clearPrototypeUserAgentUsername,
  setPrototypeUserAgentUsername,
  type Config,
} from '@/config'

import {
  isWikitaLiteConfigHydrationSuppressed,
  setWikitaLiteConfigSaveSuppressed,
  setWikitaLiteUrlModeActive,
} from '../data/configBridge'
import {
  isWikitaLiteRoute,
  parseWikitaLiteQuery,
  stateToConfigPatch,
  type WikitaLiteUrlState,
  type WikitaLiteUrlStatePatch,
} from '../data/urlStateSchema'
import { useWikitaLiteRoute } from './useWikitaLiteRoute'

let configRef: Ref<Config> | null = null

function hydrateConfigFromState(state: WikitaLiteUrlState): void {
  if (!configRef) return

  const patch = stateToConfigPatch(state)
  // During onboarding, WikitaLiteOnboarding owns simulated user state — URL defaults
  // would otherwise reset `user` to `'logged-out'` on every title/search navigation.
  const activeUser = state.onboarded ? state.user : configRef.value.user
  const existingLists = configRef.value.userPageLists[activeUser]
  const applySavedFromUrl =
    state.onboarded || (configRef.value.user === 'new' && patch.readingList.length > 0)

  setWikitaLiteConfigSaveSuppressed(true)
  configRef.value = {
    ...configRef.value,
    theme: patch.theme,
    appPlatform: patch.appPlatform,
    webSkin: patch.webSkin,
    ...(state.onboarded ? { user: patch.user, realUsername: patch.realUsername } : {}),
    knownLanguages: [...patch.knownLanguages],
    userPageLists: {
      ...configRef.value.userPageLists,
      [activeUser]: {
        ...existingLists,
        readingList: applySavedFromUrl
          ? [...patch.readingList]
          : [...existingLists.readingList],
        readingListSavedAt: applySavedFromUrl
          ? [...patch.readingListSavedAt]
          : [...existingLists.readingListSavedAt],
        editedPages: [...patch.editedPages],
        watchlist: [...patch.watchlist],
      },
    },
  }
  setWikitaLiteConfigSaveSuppressed(false)
}

function configToStatePatch(config: Config): WikitaLiteUrlStatePatch {
  const activeUser = config.user
  const lists = config.userPageLists[activeUser]

  return {
    user: config.user,
    realUser: config.realUsername,
    theme: config.theme,
    skin: config.webSkin,
    platform: config.appPlatform,
    langs: [...config.knownLanguages],
    saved: [...lists.readingList],
    savedTs: [...lists.readingListSavedAt],
    edited: [...lists.editedPages],
    watchlist: [...lists.watchlist],
  }
}

function createWikitaLiteUrlState() {
  const route = useRoute()
  const { replaceQuery, router } = useWikitaLiteRoute()

  watch(
    () => route.path,
    (path) => {
      setWikitaLiteUrlModeActive(isWikitaLiteRoute(path))
    },
    { immediate: true },
  )

  const isHydrating = ref(false)
  let syncDebounce: ReturnType<typeof setTimeout> | null = null
  let configWatchStop: (() => void) | null = null

  const state = computed(() => parseWikitaLiteQuery(route.query))

  const isOnboarded = computed(() => state.value.onboarded)

  function patchState(patch: WikitaLiteUrlStatePatch): Promise<void> {
    return replaceQuery(patch)
  }

  function resetState(): Promise<void> {
    return router.replace({ path: route.path, query: {} })
  }

  watch(
    state,
    (value) => {
      isHydrating.value = true
      hydrateConfigFromState(value)
      isHydrating.value = false
    },
    { immediate: true },
  )

  watch(
    [() => route.path, state],
    ([path, value]) => {
      if (isWikitaLiteRoute(path)) {
        setPrototypeUserAgentUsername(value.displayName || value.username)
      } else {
        clearPrototypeUserAgentUsername()
      }
    },
    { immediate: true },
  )

  if (configRef && !configWatchStop) {
    configWatchStop = watch(
      configRef,
      (config) => {
        if (isHydrating.value || isWikitaLiteConfigHydrationSuppressed()) return
        if (!isWikitaLiteRoute(route.path)) return
        if (syncDebounce) clearTimeout(syncDebounce)
        syncDebounce = setTimeout(() => {
          const patch = configToStatePatch(config)
          // Saved pages during onboarding live in config only; flushed on ?onboarded=1.
          if (!isOnboarded.value) {
            delete patch.saved
            delete patch.savedTs
          }
          void patchState(patch)
        }, 100)
      },
      { deep: true },
    )
  }

  return {
    state,
    isOnboarded,
    patchState,
    resetState,
    isHydrating,
  }
}

let singleton: ReturnType<typeof createWikitaLiteUrlState> | null = null

/** Call once from wikita-lite shell entry points. */
export function initWikitaLiteUrlState(): ReturnType<typeof createWikitaLiteUrlState> {
  if (!singleton) {
    configRef = getMutableConfigRef()
    singleton = createWikitaLiteUrlState()
  }
  return singleton
}

export function useWikitaLiteUrlState() {
  if (!singleton) {
    return initWikitaLiteUrlState()
  }
  return singleton
}

export type { WikitaLiteUrlState, WikitaLiteUrlStatePatch }
