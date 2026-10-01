import type { RouteLocationRaw } from 'vue-router'

/** The Home prototype root — the Main Page while logged out. */
export const HOME_PATH = '/home'

/** The prototype's own `Special:CreateAccount` (`home.create-account`). */
export const CREATE_ACCOUNT_PATH = `${HOME_PATH}/create-account`

const MAIN_PAGE_TITLE = 'Main Page'

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
 * The Main Page maps back to {@link HOME_PATH}.
 */
export function homeArticleLocation(
  title: string,
  fragment: string | null = null,
): RouteLocationRaw {
  const hash = fragment ? `#${fragment}` : ''
  if (normalizeTitle(title) === MAIN_PAGE_TITLE) return { path: HOME_PATH, hash }
  const slug = encodeURIComponent(normalizeTitle(title).replace(/ /g, '_'))
  return { path: `${HOME_PATH}/wiki/${slug}`, hash }
}
