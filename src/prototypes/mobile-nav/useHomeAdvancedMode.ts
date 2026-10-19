import { computed, ref } from 'vue'

import { loadHomeConfig, patchHomeConfig } from './data/homeConfig'

// Module-level: the main menu and Prototype settings share one switch.
const stored = ref<boolean | undefined>(undefined)

/** Minerva's Advanced mode, set in Prototype settings: the main menu shows its editor links. */
export function useHomeAdvancedMode() {
  if (stored.value === undefined) stored.value = loadHomeConfig().advancedMode

  const advancedMode = computed({
    get: () => stored.value === true,
    set: (value: boolean) => {
      stored.value = patchHomeConfig({ advancedMode: value }).advancedMode
    },
  })

  return { advancedMode }
}
