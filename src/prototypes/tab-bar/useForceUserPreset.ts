import { onBeforeUnmount } from 'vue'

import { useConfig } from '@/composables/useConfig'
import type { ConfigUser } from '@/config'

let savedUser: ConfigUser | null = null
let activeCount = 0

/**
 * Force the global user preset while any page of this prototype is mounted and
 * restore the previous one when the last page unmounts.
 *
 * A module-level counter means switching between `/tab-bar` pages never records
 * the forced preset as the “previous” value.
 */
export function useForceUserPreset(preset: ConfigUser): void {
  const { user } = useConfig()

  if (activeCount === 0) savedUser = user.value
  activeCount++
  // Synchronous in setup so the first render already shows the preset.
  if (user.value !== preset) user.value = preset

  onBeforeUnmount(() => {
    activeCount = Math.max(0, activeCount - 1)
    if (activeCount === 0 && savedUser !== null) {
      user.value = savedUser
      savedUser = null
    }
  })
}
