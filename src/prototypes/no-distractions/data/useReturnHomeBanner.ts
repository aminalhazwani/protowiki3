import { ref } from 'vue'

/**
 * Shared dismissal state for the return-to-Home banner.
 *
 * Module-level refs so the banner, the screens, and the Home watcher all read
 * and write one source of truth within a page session. The dismissed flag is
 * persisted (localStorage) so the reminder stays gone across reloads.
 */

const DISMISS_KEY = 'nd:return-home-banner-dismissed'

function readFlag(): boolean {
  try {
    return localStorage.getItem(DISMISS_KEY) === '1'
  } catch {
    return false
  }
}

const dismissed = ref(readFlag())
// Whether the reminder has actually been shown this session. Returning Home only
// dismisses it *after* it's been seen, so onboarding's initial Home arrival
// (before any article visit) doesn't pre-dismiss it.
const seen = ref(false)

export function useReturnHomeBanner() {
  function markSeen(): void {
    seen.value = true
  }

  function dismiss(): void {
    dismissed.value = true
    try {
      localStorage.setItem(DISMISS_KEY, '1')
    } catch {
      // Ignore storage failures (private mode, quota); the ref still hides it now.
    }
  }

  /** Dismiss on returning Home, but only once the reminder has been shown. */
  function dismissIfSeen(): void {
    if (seen.value) dismiss()
  }

  return { dismissed, seen, markSeen, dismiss, dismissIfSeen }
}
