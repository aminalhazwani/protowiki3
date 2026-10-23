import type { RouteLocationRaw } from 'vue-router'

/** The prototype root — the Main Page while logged out. Copied from `/home`. */
export const HOME_PATH = '/mobile-nav'

/** The prototype's own `Special:CreateAccount` (`home.create-account`). */
export const CREATE_ACCOUNT_PATH = `${HOME_PATH}/create-account`

export const MAIN_PAGE_TITLE = 'Main Page'

/**
 * The Main Page as a wiki page (`home.wiki.[title]`): where the wordmark leads
 * once signed in, when {@link HOME_PATH} is the Home rather than the Main Page.
 */
export const MAIN_PAGE_PATH = `${HOME_PATH}/wiki/Main_Page`

/** `Gravity_dam` / `Gravity%20dam` → `Gravity dam`. */
export function normalizeTitle(raw: string): string {
  let title = raw
  try {
    title = decodeURIComponent(raw)
  } catch {
    // Malformed escape — keep the raw value.
  }
  return title.replace(/_/g, ' ').trim()
}

/** A module's own page (`home.[module]`), e.g. `/home/trending`. */
export function homeModuleLocation(id: string): RouteLocationRaw {
  return { path: `${HOME_PATH}/${id}` }
}

/** Title from the `home.wiki.[title]` route param. */
export function titleFromRouteParam(param: string | string[] | undefined): string {
  const value = Array.isArray(param) ? param[0] : param
  return normalizeTitle(value ?? '')
}

/**
 * In-prototype location for a wiki article, like Wikipedia's `/wiki/Title`.
 * The Main Page is {@link MAIN_PAGE_PATH}, so it is the Main Page signed in too.
 */
export function homeArticleLocation(
  title: string,
  fragment: string | null = null,
): RouteLocationRaw {
  const hash = fragment ? `#${fragment}` : ''
  if (normalizeTitle(title) === MAIN_PAGE_TITLE) return { path: MAIN_PAGE_PATH, hash }
  // Wikipedia leaves `:` and `,` readable (`/wiki/Special:Nearby`).
  const slug = encodeURIComponent(normalizeTitle(title).replace(/ /g, '_'))
    .replace(/%3A/gi, ':')
    .replace(/%2C/gi, ',')
  return { path: `${HOME_PATH}/wiki/${slug}`, hash }
}
