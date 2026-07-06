import { ref } from 'vue'

/**
 * Shared dismissal state for the return-to-Home banner.
 *
 * A module-level ref so the banner and the screens that can dismiss it (the X,
 * and the account-menu → Home action) read and write one source of truth. The
 * flag is persisted (localStorage) so the reminder stays gone across reloads.
 * The banner otherwise persists on the main page and articles.
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
