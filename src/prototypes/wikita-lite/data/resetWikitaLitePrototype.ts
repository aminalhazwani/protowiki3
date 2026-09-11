/** Clear all stored data and return to the prototype splash screen. */
export function resetWikitaLitePrototype(): void {
  if (typeof window === 'undefined') return

  try {
    window.localStorage.clear()
  } catch {
    // Private mode or blocked storage — ignore.
  }

  window.location.assign(`${import.meta.env.BASE_URL}wikita-lite`)
}
