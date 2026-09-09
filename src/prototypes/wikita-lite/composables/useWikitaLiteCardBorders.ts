import { computed } from 'vue'

import { useWikitaLiteUrlState } from './useWikitaLiteUrlState'

export function useWikitaLiteCardBorders() {
  const { state, patchState } = useWikitaLiteUrlState()

  const hideCardBorders = computed({
    get: () => state.value.hideCardBorders,
    set: (value: boolean) => {
      void patchState({ hideCardBorders: value })
    },
  })

  function toggleHideCardBorders(): void {
    hideCardBorders.value = !hideCardBorders.value
  }

  return {
    hideCardBorders,
    toggleHideCardBorders,
  }
}

let singleton: ReturnType<typeof useWikitaLiteCardBorders> | null = null

export function useWikitaLiteCardBordersSingleton() {
  if (!singleton) {
    singleton = useWikitaLiteCardBorders()
  }
  return singleton
}
