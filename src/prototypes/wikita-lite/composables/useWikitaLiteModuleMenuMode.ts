import { computed } from 'vue'

import { useWikitaLiteUrlState } from './useWikitaLiteUrlState'

export function useWikitaLiteModuleMenuMode() {
  const { state, patchState } = useWikitaLiteUrlState()

  const useModuleMenuMode = computed({
    get: () => state.value.useModuleMenuMode,
    set: (value: boolean) => {
      void patchState({ useModuleMenuMode: value })
    },
  })

  function toggleModuleMenuMode(): void {
    useModuleMenuMode.value = !useModuleMenuMode.value
  }

  return {
    useModuleMenuMode,
    toggleModuleMenuMode,
  }
}

let singleton: ReturnType<typeof useWikitaLiteModuleMenuMode> | null = null

export function useWikitaLiteModuleMenuModeSingleton() {
  if (!singleton) {
    singleton = useWikitaLiteModuleMenuMode()
  }
  return singleton
}
