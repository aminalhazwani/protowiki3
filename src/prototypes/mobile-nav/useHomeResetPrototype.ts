import { useRoute, useRouter } from 'vue-router'

import { HOME_PATH } from './routes'

/** home2's "Reset prototype", for starting a test session over (☰ menu and main menu drawer). */
export function useHomeResetPrototype() {
  const route = useRoute()
  const router = useRouter()

  /*
   * Everything this browser stored (home2): ProtoWiki's settings too, not just the
   * Home's. Then a fresh load of the logged-out Main Page, where the splash shows
   * again. A test link's pinned `?skin=` / `?theme=` carry over.
   */
  function resetPrototype(): void {
    try {
      window.localStorage.clear()
    } catch {
      // Unavailable storage — the reload still starts logged out.
    }
    const query: Record<string, string> = { user: 'logged-out' }
    for (const key of ['skin', 'theme']) {
      const value = route.query[key]
      if (typeof value === 'string') query[key] = value
    }
    window.location.assign(router.resolve({ path: HOME_PATH, query }).href)
  }

  return { resetPrototype }
}
