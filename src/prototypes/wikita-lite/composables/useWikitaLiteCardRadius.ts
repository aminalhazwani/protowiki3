import { computed } from 'vue'

import { useWikitaLiteUrlState } from './useWikitaLiteUrlState'

export function useWikitaLiteCardRadius() {
  const { state, patchState } = useWikitaLiteUrlState()

  const useLargeRadius = computed({
    get: () => state.value.useLargeRadius,
    set: (value: boolean) => {
      void patchState({ useLargeRadius: value })
    },
  })

  const cardRadiusStyle = computed(() => ({
    '--wikita-lite-card-radius': useLargeRadius.value
      ? 'var(--spacing-25)'
      : 'var(--border-radius-base)',
  }))

  function toggleLargeRadius(): void {
    useLargeRadius.value = !useLargeRadius.value
  }

  return {
    useLargeRadius,
    cardRadiusStyle,
    toggleLargeRadius,
  }
}

let singleton: ReturnType<typeof useWikitaLiteCardRadius> | null = null

export function useWikitaLiteCardRadiusSingleton() {
  if (!singleton) {
    singleton = useWikitaLiteCardRadius()
  }
  return singleton
}
