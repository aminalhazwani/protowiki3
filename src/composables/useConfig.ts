import {
  computed,
  onScopeDispose,
  readonly,
  shallowRef,
  watch,
  watchEffect,
  type ComputedRef,
  type DeepReadonly,
  type Ref,
} from 'vue'

import {
  configUserDisplayName,
  configUserPageTitle,
  DEFAULT_CONFIG,
  isDefaultUserPageLists,
  langForUser,
  resetUserPageLists,
  saveConfig,
  type ConfigAppPlatform,
  type Config,
  type ConfigTheme,
  type ConfigWebSkin,
  type ConfigUser,
  type PageListKey,
  type UserPageLists,
} from '@/config'
import {
  onAppPlatformSettingChanged,
  onRealUsernameSettingChanged,
  onThemeSettingChanged,
  onUserSettingChanged,
  onWebSkinSettingChanged,
  protowikiConfig,
} from '@/appearance'

const config = protowikiConfig

/** PROTOWIKI+ (Home) How a prototype adjusts who appears signed in — see {@link useUserOverride}. */
export interface UserOverride {
  /** Preset to show instead of the saved one; omit to keep the saved preset. */
  user?: ConfigUser
  /** Shown instead of the preset's display name (e.g. an account made in the prototype). */
  displayName?: string
}

interface ActiveUserOverride {
  owner: symbol
  value: UserOverride
}

const userOverride = shallowRef<ActiveUserOverride | null>(null)

/**
 * In-memory override of the signed-in user (preset and/or display name) for as
 * long as the calling component (or effect scope) is alive. Never persisted: the
 * user's saved setting is left untouched, and other prototypes don't see it.
 * `null` from `source` means "no override". Every `useConfig()` reader (`user`,
 * `displayName`, `pageTitle`, `lang`, page lists) follows it, so the chrome and
 * article header do too.
 */
export function useUserOverride(source: () => UserOverride | null): void {
  const owner = Symbol('user-override')
  watchEffect(() => {
    const value = source()
    if (value) {
      userOverride.value = { owner, value }
    } else if (userOverride.value?.owner === owner) {
      userOverride.value = null
    }
  })
  onScopeDispose(() => {
    // Route changes can mount the next override before this one is disposed.
    if (userOverride.value?.owner === owner) userOverride.value = null
  })
}

watch(
  config,
  (value) => {
    saveConfig(value)
  },
  { deep: true },
)

watch(
  () => config.value.theme,
  (preference) => {
    onThemeSettingChanged(preference)
  },
)

watch(
  () => config.value.webSkin,
  (webSkin) => {
    onWebSkinSettingChanged(webSkin)
  },
)

watch(
  () => config.value.appPlatform,
  (platform) => {
    onAppPlatformSettingChanged(platform)
  },
)

// PROTOWIKI+ (Home) Keep `?user=` / `?realUser=` in step with the Mock user settings.
watch(
  () => config.value.user,
  (user) => {
    onUserSettingChanged(user)
  },
)

watch(
  () => config.value.realUsername,
  (realUsername) => {
    onRealUsernameSettingChanged(realUsername)
  },
)

export function useConfig(): {
  config: DeepReadonly<Ref<Config>>
  theme: Ref<ConfigTheme>
  appPlatform: Ref<ConfigAppPlatform>
  webSkin: Ref<ConfigWebSkin>
  user: Ref<ConfigUser>
  realUsername: Ref<string>
  lang: Ref<string>
  realLang: ComputedRef<string>
  displayName: ComputedRef<string>
  pageTitle: ComputedRef<string>
  currentUserPageLists: ComputedRef<UserPageLists>
  isCurrentUserPageListsModified: ComputedRef<boolean>
  setCurrentUserPageList: (field: PageListKey, pages: string[]) => void
  resetCurrentUserPageLists: () => void
} {
  const theme = computed({
    get: () => config.value.theme,
    set: (value: ConfigTheme) => {
      config.value = { ...config.value, theme: value }
    },
  })

  const appPlatform = computed({
    get: () => config.value.appPlatform,
    set: (value: ConfigAppPlatform) => {
      config.value = { ...config.value, appPlatform: value }
    },
  })

  const webSkin = computed({
    get: () => config.value.webSkin,
    set: (value: ConfigWebSkin) => {
      config.value = { ...config.value, webSkin: value }
    },
  })

  const user = computed({
    get: () => userOverride.value?.value.user ?? config.value.user,
    set: (value: ConfigUser) => {
      config.value = { ...config.value, user: value }
    },
  })

  const realUsername = computed({
    get: () => config.value.realUsername,
    set: (value: string) => {
      config.value = { ...config.value, realUsername: value }
    },
  })

  const lang = computed({
    get: () => config.value.userPageLists[user.value].lang,
    set: (value: string) => {
      const activeUser = user.value
      config.value = {
        ...config.value,
        userPageLists: {
          ...config.value.userPageLists,
          [activeUser]: {
            ...config.value.userPageLists[activeUser],
            lang: value,
          },
        },
      }
    },
  })

  const realLang = computed(() => langForUser('real', config.value.userPageLists))

  const displayName = computed(
    () =>
      userOverride.value?.value.displayName ??
      configUserDisplayName(user.value, config.value.realUsername),
  )

  const pageTitle = computed(() => {
    const override = userOverride.value?.value
    if (override?.displayName && override.user !== 'logged-out') {
      return `Hello, ${override.displayName}!`
    }
    return configUserPageTitle(user.value, config.value.realUsername)
  })

  const currentUserPageLists = computed(() => config.value.userPageLists[user.value])

  const isCurrentUserPageListsModified = computed(() => {
    if (!isDefaultUserPageLists(user.value, currentUserPageLists.value)) return true
    if (user.value === 'real') {
      return config.value.realUsername !== DEFAULT_CONFIG.realUsername
    }
    return false
  })

  function setCurrentUserPageList(field: PageListKey, pages: string[]) {
    const activeUser = user.value
    config.value = {
      ...config.value,
      userPageLists: {
        ...config.value.userPageLists,
        [activeUser]: {
          ...config.value.userPageLists[activeUser],
          [field]: [...pages],
        },
      },
    }
  }

  function resetCurrentUserPageLists() {
    const activeUser = user.value
    config.value = {
      ...config.value,
      realUsername: activeUser === 'real' ? DEFAULT_CONFIG.realUsername : config.value.realUsername,
      userPageLists: {
        ...config.value.userPageLists,
        [activeUser]: resetUserPageLists(activeUser),
      },
    }
  }

  return {
    config: readonly(config),
    theme,
    appPlatform,
    webSkin,
    user,
    realUsername,
    lang,
    realLang,
    displayName,
    pageTitle,
    currentUserPageLists,
    isCurrentUserPageListsModified,
    setCurrentUserPageList,
    resetCurrentUserPageLists,
  }
}
