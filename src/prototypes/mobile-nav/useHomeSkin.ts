import { computed, ref } from 'vue'

import { globalSkin } from '@/theme'

import { loadHomeConfig, patchHomeConfig, type HomeSkin } from './data/homeConfig'

// Module-level: everything reading the skin shares one value with Prototype settings.
const stored = ref<HomeSkin | undefined>(undefined)

/** The mobile skin being prototyped (Minerva Neue or Minmin), set in Prototype settings. */
export function useHomeSkin() {
  if (stored.value === undefined) stored.value = loadHomeConfig().skin

  const skin = computed({
    get: () => stored.value,
    set: (value: HomeSkin) => {
      stored.value = patchHomeConfig({ skin: value }).skin
    },
  })

  /** Minmin applies on mobile only; desktop keeps Vector. */
  const isMinmin = computed(() => stored.value === 'minmin' && globalSkin.value === 'mobile')

  return { skin, isMinmin }
}
