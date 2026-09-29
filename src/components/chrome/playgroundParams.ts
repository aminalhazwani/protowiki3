import { updateUrlQueryParams } from '@/appearance/url-query'

/**
 * URL round-tripping for the chrome playgrounds behind the main-menu button.
 * Every knob reads its boot value from the query string and writes itself back,
 * so a configured header can be shared as a link — and params are written only
 * when they differ from the active preset's value, keeping clean URLs.
 *
 * Writes are batched: a preset switch resets every knob in the same tick, and
 * one navigation per knob would each start from the same stale URL. Until a
 * batch lands, reads see it here rather than in `window.location` — the header
 * a skin switch mounts reads its knobs before the URL has caught up.
 */
const unsettled = new Map<string, string | null>()
let flushQueued = false

function readParam(key: string): string | null {
  if (unsettled.has(key)) return unsettled.get(key) ?? null
  if (typeof window === 'undefined') return null
  return new URLSearchParams(window.location.search).get(key)
}

/** Boot value for a knob with a fixed vocabulary; anything unrecognised falls back. */
export function readEnumParam<T extends string>(
  key: string,
  allowed: readonly T[],
  fallback: T,
): T {
  const value = readParam(key)
  return allowed.includes(value as T) ? (value as T) : fallback
}

/**
 * Booleans need both states spelled out: presets disagree on the default, so
 * “absent” can't stand in for `false` the way it could for a single caller.
 */
export function readFlagParam(key: string, fallback: boolean): boolean {
  const value = readParam(key)
  if (value === '1') return true
  if (value === '0') return false
  return fallback
}

/**
 * Every unsettled write goes out with each batch, not just the new ones: a batch
 * built while an earlier one is still in flight starts from the URL before it.
 */
function flush(): void {
  flushQueued = false
  const batch = Object.fromEntries(unsettled)

  void updateUrlQueryParams(batch).finally(() => {
    for (const [key, value] of Object.entries(batch)) {
      if (unsettled.get(key) === value) unsettled.delete(key)
    }
  })
}

/** Write a knob to the URL, or drop the param when it's back at its default. */
export function syncPlaygroundParam(key: string, value: string, isDefault: boolean): void {
  unsettled.set(key, isDefault ? null : value)
  if (flushQueued) return
  flushQueued = true
  queueMicrotask(flush)
}
