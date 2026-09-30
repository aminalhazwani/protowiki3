/**
 * URL params that set up the Home prototype for a shared test link. They are
 * applied once — written into the Home config — and then removed from the URL,
 * so reloading doesn't re-apply them and the config stays the source of truth.
 *
 * - `?reset` — forget everything the Home prototype stored.
 * - `?username=<name>` — name of the account made in the prototype (shown for the
 *   **New user** preset). An empty value clears it.
 *
 * Who is signed in is ProtoWiki's global `?user=` (Mock user preset:
 * `logged-out`, `new`, `experienced`, `real`). `reset` runs first, so
 * `?user=new&reset&username=Amin` is a fresh visit as a new account "Amin".
 */

import type { LocationQuery } from 'vue-router'

import { patchHomeConfig, resetHomeConfig } from './homeConfig'

export const HOME_URL_PARAMS = ['reset', 'username'] as const

function firstValue(value: LocationQuery[string]): string | null {
  const raw = Array.isArray(value) ? value[0] : value
  return raw ?? ''
}

/** Applies any Home params in `query`; returns the query without them, or `null` if there were none. */
export function applyHomeUrlParams(query: LocationQuery): LocationQuery | null {
  if (!HOME_URL_PARAMS.some((key) => key in query)) return null

  if ('reset' in query) resetHomeConfig()
  if ('username' in query) patchHomeConfig({ username: firstValue(query.username) })

  const rest = { ...query }
  for (const key of HOME_URL_PARAMS) delete rest[key]
  return rest
}
