import { computed, ref } from 'vue'

import { loadHomeConfig, patchHomeConfig, type HomeConfig } from './data/homeConfig'

// Module-level: the module's title and body read the same state. Read on first
// use, not at import, so it sees `?reset` (applied as the Home page sets up).
const config = ref<HomeConfig | null>(null)

/**
 * The reader's mentor (home2): assigned by default, with a one-time notice
 * saying so. Onboarding's survey will leave read-only readers unassigned, so
 * they're offered one instead.
 */
export function useHomeMentor() {
  config.value ??= loadHomeConfig()

  const isAssigned = computed(() => config.value?.mentorAssigned ?? true)
  const noticeDismissed = computed(() => config.value?.mentorNoticeDismissed ?? false)

  function assign(): void {
    config.value = patchHomeConfig({ mentorAssigned: true, mentorNoticeDismissed: false })
  }

  function dismissNotice(): void {
    config.value = patchHomeConfig({ mentorNoticeDismissed: true })
  }

  return { isAssigned, noticeDismissed, assign, dismissNotice }
}
