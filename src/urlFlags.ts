/**
 * Read a boolean-ish URL query flag at call time.
 *
 * Used to gate prototype/dev-only chrome (e.g. the Main menu and Prototype user
 * popovers) so research participants in a usability test don't open them. A flag
 * counts as enabled when the param is present and not `0`/`false`, so
 * `?prototype-settings=1` turns it on.
 */
export function flagEnabled(name: string): boolean {
  if (typeof window === 'undefined') return false
  const value = new URLSearchParams(window.location.search).get(name)
  return value !== null && value !== '0' && value !== 'false'
}
