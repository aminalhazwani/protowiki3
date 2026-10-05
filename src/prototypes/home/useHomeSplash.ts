import { computed, ref } from 'vue'

import { loadHomeConfig, patchHomeConfig } from './data/homeConfig'

// Module-level. Read on first use, not at import, so it sees `?reset` (applied
// as the Home page sets up).
const dismissed = ref<boolean | null>(null)

/**
 * The prototype's intro (home2's splash), over the logged-out Main Page until
 * the reader dismisses it. It comes back after "Reset prototype" or `?reset`.
 */
export function useHomeSplash() {
  dismissed.value ??= loadHomeConfig().splashDismissed

  const open = computed(() => !dismissed.value)

  function dismiss(): void {
    dismissed.value = patchHomeConfig({ splashDismissed: true }).splashDismissed
  }

  return { open, dismiss }
}
