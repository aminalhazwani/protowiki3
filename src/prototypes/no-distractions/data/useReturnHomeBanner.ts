import { ref } from 'vue'

/**
 * Shared dismissal state for the return-to-Home banner.
 *
 * The banner reminds the reader how to get back to Home whenever they're off it
 * (the main page or an article) and persists across every page they visit. It's
 * dismissed — permanently, persisted in localStorage — only by the X or by
 * returning Home through the account menu (see ReadScreen `onGoHome`). Once
 * dismissed it never shows again on this browser.
 *
 * For local testing, run `resetReturnHomeBanner()` in the devtools console to
 * clear the flag and show the banner again (no reload needed).
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

export function useReturnHomeBanner() {
  function dismiss(): void {
    dismissed.value = true
    try {
      localStorage.setItem(DISMISS_KEY, '1')
    } catch {
      // Ignore storage failures (private mode, quota); the ref still hides it now.
    }
  }

  return { dismissed, dismiss }
}

// Devtools escape hatch for local testing: `resetReturnHomeBanner()` clears the
// persisted flag and re-shows the banner immediately.
if (typeof window !== 'undefined') {
  ;(window as unknown as { resetReturnHomeBanner?: () => void }).resetReturnHomeBanner = () => {
    try {
      localStorage.removeItem(DISMISS_KEY)
    } catch {
      // ignore
    }
    dismissed.value = false
  }
}
