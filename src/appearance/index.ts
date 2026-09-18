/**
 * Appearance — global theme, web skin, app OS, and chrome UI language.
 *
 * - `config-store` — reactive settings (`protowikiConfig`)
 * - `app-platform` — `data-app-platform` on `<html>`
 * - `url-query` — query-string helpers and navigation preservation
 * - `url-sync` — bidirectional sync between settings and `?theme=` / `?skin=` /
 *   `?os=` / `?uselang=` / `?user=`
 * - `boot` — entry points for `main.ts`
 *
 * Theme / skin rendering lives in `@/theme`, the UI language in `@/uiLanguage`;
 * persistence schema in `@/config`.
 */

export { protowikiConfig } from './config-store'

export {
  applyAppPlatform,
  applyAppPlatformPreference,
  globalAppPlatform,
  initAppPlatform,
} from './app-platform'

export {
  mergedLocationQuery,
  preservedQueryFromLocationQuery,
  preservedQueryMissingFromRoute,
  PRESERVED_URL_QUERY_PARAMS,
  type PreservedUrlQueryParam,
} from './url-query'

export {
  onAppPlatformSettingChanged,
  onThemeSettingChanged,
  onUserSettingChanged,
  onWebSkinSettingChanged,
  setupAppearanceUrlSync,
  syncAppearanceFromBootUrl,
  type UrlSkinParam,
  type UrlThemeParam,
  type UrlUserParam,
} from './url-sync'

export { bootAppearance, wireAppearanceRouter } from './boot'
