import { removeUrlQueryParam, syncUrlQueryParam } from '@/appearance/url-query'

/**
 * URL round-tripping for the chrome playgrounds behind the main-menu button.
 * Every knob reads its boot value from the query string and writes itself back,
 * so a configured header can be shared as a link — and params are written only
 * when they differ from the default the calling skin passes in, keeping clean
 * URLs.
 */
function readParam(key: string): string | null {
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
 * Booleans need both states spelled out: skins and surfaces disagree on the
 * default, so “absent” can't stand in for `false` the way it could for a single
 * caller.
 */
export function readFlagParam(key: string, fallback: boolean): boolean {
  const value = readParam(key)
  if (value === '1') return true
  if (value === '0') return false
  return fallback
}

/** Write a knob to the URL, or drop the param when it's back at its default. */
export function syncPlaygroundParam(key: string, value: string, isDefault: boolean): void {
  if (isDefault) removeUrlQueryParam(key)
  else syncUrlQueryParam(key, value)
}

/** `syncPlaygroundParam` for a flag, spelling both states out. */
export function syncPlaygroundFlag(key: string, value: boolean, fallback: boolean): void {
  syncPlaygroundParam(key, value ? '1' : '0', value === fallback)
}
