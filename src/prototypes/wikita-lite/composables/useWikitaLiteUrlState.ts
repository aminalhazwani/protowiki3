import { computed, effectScope, ref, watch, type Ref } from 'vue'
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
/** Fingerprint of the config the URL last hydrated, so syncing it back is skipped. */
let lastHydratedConfigKey: string | null = null

function sameList<T>(a: readonly T[], b: readonly T[]): boolean {
  return a.length === b.length && a.every((value, index) => value === b[index])
}

/** `next` when its contents differ from `current`, else `current` (keeps identity). */
function keepList<T>(current: T[], next: readonly T[]): T[] {
  return sameList(current, next) ? current : [...next]
}

function hydrateConfigFromState(state: WikitaLiteUrlState): void {
  if (!configRef) return

  const current = configRef.value
  const patch = stateToConfigPatch(state)
  // During onboarding, WikitaLiteOnboarding owns simulated user state — URL defaults
  // would otherwise reset `user` to `'logged-out'` on every title/search navigation.
  const activeUser = state.onboarded ? state.user : current.user
  const existingLists = current.userPageLists[activeUser]
  const applySavedFromUrl =
    state.onboarded || (current.user === 'new' && patch.readingList.length > 0)

  const nextUser = state.onboarded ? patch.user : current.user
  const nextRealUsername = state.onboarded ? patch.realUsername : current.realUsername
  const knownLanguages = keepList(current.knownLanguages, patch.knownLanguages)
  const readingList = applySavedFromUrl
    ? keepList(existingLists.readingList, patch.readingList)
    : existingLists.readingList
  const readingListSavedAt = applySavedFromUrl
    ? keepList(existingLists.readingListSavedAt, patch.readingListSavedAt)
    : existingLists.readingListSavedAt
  const editedPages = keepList(existingLists.editedPages, patch.editedPages)
  const watchlist = keepList(existingLists.watchlist, patch.watchlist)

  const unchanged =
    current.theme === patch.theme &&
    current.appPlatform === patch.appPlatform &&
    current.webSkin === patch.webSkin &&
    current.user === nextUser &&
    current.realUsername === nextRealUsername &&
    knownLanguages === current.knownLanguages &&
    readingList === existingLists.readingList &&
    readingListSavedAt === existingLists.readingListSavedAt &&
    editedPages === existingLists.editedPages &&
    watchlist === existingLists.watchlist

  // Most navigations (tab switches, dismissals, layout edits) don't touch
  // config at all; replacing it anyway re-runs everything that reads it.
  if (unchanged) {
    lastHydratedConfigKey = configStateKey(current)
    return
  }

  setWikitaLiteConfigSaveSuppressed(true)
  configRef.value = {
    ...current,
    theme: patch.theme,
    appPlatform: patch.appPlatform,
    webSkin: patch.webSkin,
    ...(state.onboarded ? { user: patch.user, realUsername: patch.realUsername } : {}),
    knownLanguages,
    userPageLists: {
      ...current.userPageLists,
      [activeUser]: {
        ...existingLists,
        readingList,
        readingListSavedAt,
        editedPages,
        watchlist,
      },
    },
  }
  lastHydratedConfigKey = configStateKey(configRef.value)
  setWikitaLiteConfigSaveSuppressed(false)
}

function configStateKey(config: Config): string {
  return JSON.stringify(configToStatePatch(config))
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

  // Path-only navigations hand out a fresh but identical query; keep the parsed
  // state so nothing downstream recomputes.
  let lastQueryKey = ''
  const state = computed<WikitaLiteUrlState>((previous) => {
    const queryKey = JSON.stringify(route.query)
    if (previous && queryKey === lastQueryKey) return previous
    lastQueryKey = queryKey
    return parseWikitaLiteQuery(route.query)
  })

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
        // The flags above are already reset by the time this deep watcher runs,
        // so compare contents: a config the URL just produced needn't go back.
        if (configStateKey(config) === lastHydratedConfigKey) return
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

/**
 * Call once from wikita-lite shell entry points.
 *
 * The watchers run in a detached scope: created in the calling component's
 * scope, they'd stop when that page unmounts, and config changes made on the
 * next page (a save on a subpage, say) would never reach the URL.
 */
export function initWikitaLiteUrlState(): ReturnType<typeof createWikitaLiteUrlState> {
  if (!singleton) {
    configRef = getMutableConfigRef()
    singleton = effectScope(true).run(createWikitaLiteUrlState)!
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
