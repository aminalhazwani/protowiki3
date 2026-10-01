/**
 * Day-keyed cache for Home module data, in localStorage. Cache only: clearing it
 * must only ever cost a refetch. One entry per slot; writing a new day replaces
 * the old one. Empty results are never cached, so they're retried next load.
 * `?nocache=1` in the URL skips reads (writes still happen). A read can also cap
 * an entry's age, for data that goes stale within the day.
 *
 * Kept apart from `homeConfig.ts` — that's user state, this is disposable.
 */

const CACHE_PREFIX = 'protowiki-home-cache-v1:'

interface CacheEntry<T> {
  day: string
  value: T
  /** When it was written (ms). */
  at?: number
}

/** `YYYY-MM-DD` in UTC — Wikipedia's featured content rolls over at 00:00 UTC. */
export function utcDayKey(date = new Date()): string {
  return date.toISOString().slice(0, 10)
}

function cacheBypassed(): boolean {
  try {
    return new URLSearchParams(window.location.search).get('nocache') === '1'
  } catch {
    return false
  }
}

export function readDayCache<T>(slot: string, day: string, maxAgeMs?: number): T | null {
  if (cacheBypassed()) return null
  try {
    const raw = window.localStorage.getItem(CACHE_PREFIX + slot)
    if (!raw) return null
    const entry = JSON.parse(raw) as CacheEntry<T>
    if (entry.day !== day) return null
    if (maxAgeMs != null && Date.now() - (entry.at ?? 0) > maxAgeMs) return null
    return entry.value
  } catch {
    return null
  }
}

export function writeDayCache<T>(slot: string, day: string, value: T): void {
  if (Array.isArray(value) && value.length === 0) return
  try {
    const entry: CacheEntry<T> = { day, value, at: Date.now() }
    window.localStorage.setItem(CACHE_PREFIX + slot, JSON.stringify(entry))
  } catch {
    // Full or unavailable storage must never break the page.
  }
}
