/**
 * URL params that set up the Home prototype for a shared test link. The
 * one-off ones (`reset`, `username`, `onboarding`) are applied once — written
 * into the Home config — and then removed from the URL, so reloading doesn't
 * re-apply them. The lists (`interests`, `saved`, `watchlist`, `edited`) are
 * applied the same way but then stay in the URL, kept in step with the settings
 * (`useHomeUrlSync`), so the address bar is always a link to what you see.
 *
 * - `?reset` — forget everything the Home prototype stored (the intro splash shows again).
 * - `?username=<name>` — name of the account made in the prototype (shown for the
 *   **New user** preset). An empty value clears it.
 * - `?onboarding=<step>` — open the onboarding wizard on that step (`welcome`, …;
 *   see `data/onboarding.ts`). An empty or unknown value closes it.
 * - `?interests=A|B` — Personalization's interests (at most `MAX_INTERESTS`).
 * - `?saved=A|B`, `?watchlist=A|B`, `?edited=A|B` — the Mock user's saved pages,
 *   watchlist and edited pages (ProtoWiki's page lists, for the preset in effect).
 *   A **Real user**'s edited pages are fetched on load, so `edited` won't stick there.
 *
 * Lists are page titles separated by `|` (titles can hold commas); `_` reads as a
 * space, so `?saved=Wet_Leg|Gorillaz` works. An empty value clears the list.
 * A list shows in the URL only while it differs from the preset's default, and
 * then with `?user=` (and `?realUser=`), since the page lists belong to a preset.
 *
 * Who is signed in is ProtoWiki's global `?user=` (Mock user preset:
 * `logged-out`, `new`, `experienced`, `real`). `reset` runs first, so
 * `?user=new&reset&username=Amin` is a fresh visit as a new account "Amin".
 */

import { computed, watch } from 'vue'
import { useRoute, useRouter, type LocationQuery } from 'vue-router'

import { useConfig } from '@/composables/useConfig'
import { DEFAULT_USER_PAGE_LISTS, type PageListKey } from '@/config'

import { normalizeTitle } from '../routes'
import { useHomePersonalization } from '../useHomePersonalization'
import { patchHomeConfig, resetHomeConfig } from './homeConfig'
import { isOnboardingStep } from './onboarding'

/** Page-list params and the ProtoWiki list each one sets. */
const PAGE_LIST_PARAMS = {
  saved: 'readingList',
  watchlist: 'watchlist',
  edited: 'editedPages',
} as const satisfies Record<string, PageListKey>

/** Applied once, then removed from the URL. */
const ONE_OFF_PARAMS = ['reset', 'username', 'onboarding'] as const

/** Applied, then kept in the URL in step with the settings. */
const LIST_PARAMS = [
  'interests',
  ...(Object.keys(PAGE_LIST_PARAMS) as (keyof typeof PAGE_LIST_PARAMS)[]),
] as const

export const HOME_URL_PARAMS = [...ONE_OFF_PARAMS, ...LIST_PARAMS] as const

function firstValue(value: LocationQuery[string]): string | null {
  const raw = Array.isArray(value) ? value[0] : value
  return raw ?? ''
}

/** `['A', 'B C']` → `A|B_C`. */
function formatTitleList(titles: readonly string[]): string {
  return titles.map((title) => title.replace(/ /g, '_')).join('|')
}

const sameList = (a: readonly string[], b: readonly string[]) =>
  a.length === b.length && a.every((value, i) => value === b[i])

/** `A|B_C` → `['A', 'B C']`, deduplicated. */
function titleList(value: LocationQuery[string]): string[] {
  const titles = (firstValue(value) ?? '').split('|').map(normalizeTitle).filter(Boolean)
  return [...new Set(titles)]
}

/** Applies any Home params in `query`; `false` if there were none. */
export function applyHomeUrlParams(query: LocationQuery): boolean {
  if (!HOME_URL_PARAMS.some((key) => key in query)) return false

  if ('reset' in query) resetHomeConfig()
  if ('username' in query) patchHomeConfig({ username: firstValue(query.username) })
  if ('onboarding' in query) {
    const step = firstValue(query.onboarding)
    patchHomeConfig({ onboarding: isOnboardingStep(step) ? step : null })
  }
  // Through Personalization, so its in-memory copy (and the modules) follow.
  if ('interests' in query) useHomePersonalization().setInterests(titleList(query.interests))
  const { setCurrentUserPageList } = useConfig()
  for (const [param, list] of Object.entries(PAGE_LIST_PARAMS)) {
    if (param in query) setCurrentUserPageList(list, titleList(query[param]))
  }
  return true
}

/**
 * Keeps the URL in step with the Home's settings, on every Home page: drops the
 * one-off params once applied, and writes the lists (see the top of this file)
 * whenever they or the page change — so a link copied from the address bar
 * carries them. Call after `applyHomeUrlParams`.
 */
export function useHomeUrlSync(): void {
  const route = useRoute()
  const router = useRouter()
  const { user, realUsername, currentUserPageLists } = useConfig()
  const { interests } = useHomePersonalization()

  const listQuery = computed((): Record<string, string> => {
    const preset = user.value
    if (preset === 'logged-out') return {}
    const query: Record<string, string> = {}
    if (interests.value.length) query.interests = formatTitleList(interests.value)
    const defaults = DEFAULT_USER_PAGE_LISTS[preset]
    for (const [param, list] of Object.entries(PAGE_LIST_PARAMS)) {
      // A real user's edits come from the wiki on every load, not from the link.
      if (preset === 'real' && list === 'editedPages') continue
      const pages = currentUserPageLists.value[list]
      if (!sameList(pages, defaults[list])) query[param] = formatTitleList(pages)
    }
    if (Object.keys(query).length === 0) return query
    // The page lists belong to a preset, so a link with them names it.
    query.user = preset
    if (preset === 'real') query.realUser = realUsername.value
    return query
  })

  watch(
    [listQuery, () => route.fullPath],
    ([lists]) => {
      const query: LocationQuery = { ...route.query }
      for (const key of HOME_URL_PARAMS) delete query[key]
      Object.assign(query, lists)
      const keys = new Set([...Object.keys(query), ...Object.keys(route.query)])
      if ([...keys].every((key) => query[key] === route.query[key])) return
      void router.replace({ query, hash: route.hash })
    },
    { immediate: true },
  )
}
