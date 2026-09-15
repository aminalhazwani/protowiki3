import { watch } from 'vue'
import type { RouteLocationNormalized, Router } from 'vue-router'

import { applyAppPlatformPreference } from './app-platform'
import { protowikiConfig } from './config-store'
import {
  isAppPrototypeRoute,
  isSyncingToUrl,
  removeUrlQueryParam,
  replaceRouteQueryUpdates,
  syncUrlQueryParam,
} from './url-query'
import {
  isConfigAppPlatform,
  isConfigUser,
  isConfigWebSkin,
  type ConfigAppPlatform,
  type ConfigTheme,
  type ConfigUser,
  type ConfigWebSkin,
} from '@/config'
import { applyThemePreference, applyWebSkinPreference } from '@/theme'
import { DEFAULT_UI_LANGUAGE, isKnownUiLanguage, uiLanguage } from '@/uiLanguage'

/** Valid `?theme=` query values (`auto` maps to the **Auto** / `system` setting). */
export type UrlThemeParam = 'light' | 'dark' | 'auto'

/** Valid `?skin=` query values — same vocabulary as **Web skin** settings. */
export type UrlSkinParam = ConfigWebSkin

/** Valid `?user=` query values — **Mock user** presets, plus spelled-out aliases. */
export type UrlUserParam = ConfigUser | keyof typeof URL_USER_ALIASES

let syncingFromUrl = false

function queryParamIsPresent(key: string): boolean {
  if (typeof window === 'undefined') return false
  return new URLSearchParams(window.location.search).has(key)
}

function readQueryParam(key: string): string | null {
  if (typeof window === 'undefined') return null
  return new URLSearchParams(window.location.search).get(key)
}

function withSyncFromUrl<T>(fn: () => T): T {
  syncingFromUrl = true
  try {
    return fn()
  } finally {
    syncingFromUrl = false
  }
}

// --- Theme (`?theme=`) — optional param, same rules as skin -----------------

export function isUrlThemeParam(value: unknown): value is UrlThemeParam {
  return value === 'light' || value === 'dark' || value === 'auto'
}

function configThemeToUrlParam(preference: ConfigTheme): UrlThemeParam {
  if (preference === 'system') return 'auto'
  return preference
}

function urlParamToConfigTheme(param: UrlThemeParam): ConfigTheme {
  if (param === 'auto') return 'system'
  return param
}

function setThemeFromUrlParam(urlTheme: UrlThemeParam): void {
  const preference = urlParamToConfigTheme(urlTheme)
  if (syncingFromUrl || protowikiConfig.value.theme === preference) return

  withSyncFromUrl(() => {
    protowikiConfig.value = { ...protowikiConfig.value, theme: preference }
    applyThemePreference(preference)
  })
}

export function onThemeSettingChanged(preference: ConfigTheme): void {
  if (syncingFromUrl) return

  applyThemePreference(preference)

  if (!queryParamIsPresent('theme')) return

  syncUrlQueryParam('theme', configThemeToUrlParam(preference))
}

function syncThemeFromUrlOnRoute(to: RouteLocationNormalized): void {
  const urlTheme = typeof to.query.theme === 'string' ? to.query.theme : null
  if (!isUrlThemeParam(urlTheme)) return

  const preference = urlParamToConfigTheme(urlTheme)
  if (protowikiConfig.value.theme !== preference) {
    setThemeFromUrlParam(urlTheme)
  }
}

// --- Web skin (`?skin=`) — optional param -----------------------------------

export function isUrlSkinParam(value: unknown): value is UrlSkinParam {
  return isConfigWebSkin(value)
}

function setWebSkinFromUrlParam(urlSkin: UrlSkinParam): void {
  if (syncingFromUrl || protowikiConfig.value.webSkin === urlSkin) return

  withSyncFromUrl(() => {
    protowikiConfig.value = { ...protowikiConfig.value, webSkin: urlSkin }
    applyWebSkinPreference(urlSkin)
  })
}

export function onWebSkinSettingChanged(preference: ConfigWebSkin): void {
  if (syncingFromUrl) return

  applyWebSkinPreference(preference)

  if (!queryParamIsPresent('skin')) return

  syncUrlQueryParam('skin', preference)
}

function syncWebSkinFromUrlOnRoute(to: RouteLocationNormalized): void {
  const urlSkin = typeof to.query.skin === 'string' ? to.query.skin : null
  if (!isUrlSkinParam(urlSkin)) return

  if (protowikiConfig.value.webSkin !== urlSkin) {
    setWebSkinFromUrlParam(urlSkin)
  }
}

// --- App OS (`?os=`) — pinned on app routes; optional elsewhere -------------

function setAppPlatformFromUrl(urlOs: ConfigAppPlatform): void {
  if (syncingFromUrl || protowikiConfig.value.appPlatform === urlOs) return

  withSyncFromUrl(() => {
    protowikiConfig.value = { ...protowikiConfig.value, appPlatform: urlOs }
    applyAppPlatformPreference(urlOs)
  })
}

export function onAppPlatformSettingChanged(platform: ConfigAppPlatform): void {
  if (syncingFromUrl) return

  applyAppPlatformPreference(platform)

  if (!isAppPrototypeRoute() && !queryParamIsPresent('os')) return

  if (platform === 'auto') {
    removeUrlQueryParam('os')
    return
  }

  syncUrlQueryParam('os', platform)
}

function syncAppOsOnRoute(to: RouteLocationNormalized): void {
  const urlOs = typeof to.query.os === 'string' ? to.query.os : null
  const settingOs = protowikiConfig.value.appPlatform
  const isAppRoute = to.meta.platform === 'app'

  if (!isAppRoute) {
    if (urlOs && isConfigAppPlatform(urlOs) && urlOs !== settingOs) {
      setAppPlatformFromUrl(urlOs)
    }
    return
  }

  if (urlOs && isConfigAppPlatform(urlOs)) {
    if (urlOs !== settingOs) {
      setAppPlatformFromUrl(urlOs)
    }
    return
  }

  // Pin missing/invalid os only for explicit ios/android — never auto-add ?os=auto
  if (settingOs !== 'auto') {
    void replaceRouteQueryUpdates(to, { os: settingOs })
  }
}

// --- Mock user (`?user=`) — optional param, same rules as skin ---------------
//
// The canonical values are the **Mock user** preset ids (`logged-out`, `new`,
// `experienced`, `real`). The aliases spell out what the preset means so a
// shared link reads clearly — `?user=new-editor` is the same as `?user=new`.
// Aliases are accepted on read only; writes always use the canonical id.

const URL_USER_ALIASES = {
  anon: 'logged-out',
  'new-editor': 'new',
  'experienced-editor': 'experienced',
} as const satisfies Record<string, ConfigUser>

export function isUrlUserParam(value: unknown): value is UrlUserParam {
  return isConfigUser(value) || (typeof value === 'string' && value in URL_USER_ALIASES)
}

function urlParamToConfigUser(param: UrlUserParam): ConfigUser {
  if (isConfigUser(param)) return param
  return URL_USER_ALIASES[param]
}

function setUserFromUrlParam(urlUser: UrlUserParam): void {
  const preference = urlParamToConfigUser(urlUser)
  if (syncingFromUrl || protowikiConfig.value.user === preference) return

  withSyncFromUrl(() => {
    protowikiConfig.value = { ...protowikiConfig.value, user: preference }
  })
}

export function onUserSettingChanged(preference: ConfigUser): void {
  if (syncingFromUrl) return

  if (!queryParamIsPresent('user')) return

  syncUrlQueryParam('user', preference)
}

function syncUserFromUrlOnRoute(to: RouteLocationNormalized): void {
  const urlUser = typeof to.query.user === 'string' ? to.query.user : null
  if (!isUrlUserParam(urlUser)) return

  if (protowikiConfig.value.user !== urlParamToConfigUser(urlUser)) {
    setUserFromUrlParam(urlUser)
  }
}

// --- UI language (`?uselang=`) — MediaWiki's name for the interface language -
//
// Deliberately not `?lang=`: prototypes already use that for the *content* wiki
// an article is fetched from (see `template-app-article`). `uselang` is what
// MediaWiki itself calls the interface language, so the two stay distinguishable.

function setUiLanguageFromUrlParam(lang: string): void {
  if (syncingFromUrl || uiLanguage.value === lang) return

  withSyncFromUrl(() => {
    uiLanguage.value = lang
  })
}

/**
 * Unlike `?theme=` / `?skin=`, picking a language always writes the param —
 * sharing a prototype in a given language is the point. Returning to the
 * default drops it again rather than leaving `?uselang=en` behind.
 */
function onUiLanguageChanged(lang: string): void {
  if (syncingFromUrl) return

  if (lang === DEFAULT_UI_LANGUAGE) {
    removeUrlQueryParam('uselang')
    return
  }

  syncUrlQueryParam('uselang', lang)
}

function syncUiLanguageFromUrlOnRoute(to: RouteLocationNormalized): void {
  const urlLang = to.query.uselang
  if (!isKnownUiLanguage(urlLang)) return

  if (uiLanguage.value !== urlLang) {
    setUiLanguageFromUrlParam(urlLang)
  }
}

/**
 * `flush: 'sync'` matters: a default (deferred) watcher would run after
 * `withSyncFromUrl` has already released `syncingFromUrl`, so applying
 * `?uselang=` at boot would be mistaken for a user picking a language and
 * written back — against a router whose initial route has not resolved yet,
 * which lands the page on `/`.
 */
watch(uiLanguage, onUiLanguageChanged, { flush: 'sync' })

// --- Boot + router wiring ---------------------------------------------------

function syncOptionalParamFromBoot(
  key: string,
  isValid: (value: unknown) => boolean,
  applyFromUrl: (value: string) => void,
): void {
  const value = readQueryParam(key)
  if (!isValid(value)) return
  applyFromUrl(value as string)
}

/** Apply valid appearance query params from the URL into settings before mount. */
export function syncAppearanceFromBootUrl(): void {
  if (typeof window === 'undefined') return

  syncOptionalParamFromBoot('theme', isUrlThemeParam, (value) => {
    setThemeFromUrlParam(value as UrlThemeParam)
  })

  syncOptionalParamFromBoot('skin', isUrlSkinParam, (value) => {
    setWebSkinFromUrlParam(value as UrlSkinParam)
  })

  syncOptionalParamFromBoot('os', isConfigAppPlatform, (value) => {
    setAppPlatformFromUrl(value as ConfigAppPlatform)
  })

  syncOptionalParamFromBoot('user', isUrlUserParam, (value) => {
    setUserFromUrlParam(value as UrlUserParam)
  })

  syncOptionalParamFromBoot('uselang', isKnownUiLanguage, (value) => {
    setUiLanguageFromUrlParam(value)
  })
}

/** Keep appearance URL params and settings aligned after each navigation. */
export function setupAppearanceUrlSync(instance: Router): void {
  instance.afterEach((to) => {
    if (syncingFromUrl || isSyncingToUrl()) return

    syncThemeFromUrlOnRoute(to)
    syncWebSkinFromUrlOnRoute(to)
    syncAppOsOnRoute(to)
    syncUserFromUrlOnRoute(to)
    syncUiLanguageFromUrlOnRoute(to)
  })
}
