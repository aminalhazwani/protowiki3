import { computed, ref } from 'vue'

import { loadHomeConfig, patchHomeConfig, type HomeConfig } from './data/homeConfig'
import { useHomeOnboarding } from './useHomeOnboarding'

// Module-level: the module's title and body read the same state. Read on first
// use, not at import, so it sees `?reset` (applied as the Home page sets up).
const config = ref<HomeConfig | null>(null)

/**
 * The reader's mentor (home2): assigned by default, with a one-time notice
 * saying so. Readers whose survey answer was "Reading and exploring" are left
 * unassigned, so they're offered one instead.
 */
export function useHomeMentor() {
  config.value ??= loadHomeConfig()

  // Unless the reader chose, readers who came to read aren't assigned one (home2).
  const { survey } = useHomeOnboarding()
  const isAssigned = computed(() => config.value?.mentorAssigned ?? survey.value !== 'read')
  const noticeDismissed = computed(() => config.value?.mentorNoticeDismissed ?? false)

  function assign(): void {
    config.value = patchHomeConfig({ mentorAssigned: true, mentorNoticeDismissed: false })
  }

  function dismissNotice(): void {
    config.value = patchHomeConfig({ mentorNoticeDismissed: true })
  }

  return { isAssigned, noticeDismissed, assign, dismissNotice }
}
