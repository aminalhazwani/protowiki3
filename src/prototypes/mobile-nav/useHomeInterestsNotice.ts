import { computed, ref } from 'vue'

import { loadHomeConfig, patchHomeConfig, type HomeConfig } from './data/homeConfig'
import type { HomeModuleId } from './modules'
import { useHomeSeeds } from './useHomeSeeds'

// Module-level: every module's notice reads the same state. Read on first use,
// not at import, so it sees `?reset` (applied as the Home page sets up).
const config = ref<HomeConfig | null>(null)

/**
 * A module's "Get articles that match your interests" notice: shown while the
 * reader has given the Home nothing to go on (random cards), until dismissed
 * there.
 */
export function useHomeInterestsNotice(id: HomeModuleId) {
  config.value ??= loadHomeConfig()

  const { blank } = useHomeSeeds()

  const shown = computed(
    () => blank.value && !config.value?.interestsNoticeDismissed.includes(id),
  )

  function dismiss(): void {
    const dismissed = config.value?.interestsNoticeDismissed ?? []
    config.value = patchHomeConfig({ interestsNoticeDismissed: [...dismissed, id] })
  }

  return { shown, dismiss }
}
