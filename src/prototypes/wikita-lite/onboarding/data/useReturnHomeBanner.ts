import { computed } from 'vue'

import { useWikitaLiteUrlState } from '../../composables/useWikitaLiteUrlState'

/**
 * Shared dismissal state for the return-to-Home banner.
 *
 * Dismissal is persisted in URL ?bannerDismissed=1.
 */

export function useReturnHomeBanner() {
  const { state, patchState } = useWikitaLiteUrlState()

  const dismissed = computed(() => state.value.bannerDismissed)

  function dismiss(): void {
    void patchState({ bannerDismissed: true })
  }

  function reset(): void {
    void patchState({ bannerDismissed: false })
  }

  return { dismissed, dismiss, reset }
}

if (typeof window !== 'undefined') {
  ;(window as unknown as { resetReturnHomeBanner?: () => void }).resetReturnHomeBanner = () => {
    try {
      const { patchState } = useWikitaLiteUrlState()
      void patchState({ bannerDismissed: false })
    } catch {
      // URL state not initialized — ignore.
    }
  }
}
