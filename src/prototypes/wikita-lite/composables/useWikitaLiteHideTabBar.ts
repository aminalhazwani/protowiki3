import { computed } from 'vue'

import { useWikitaLiteUrlState } from './useWikitaLiteUrlState'

export function useWikitaLiteHideTabBar() {
  const { state, patchState } = useWikitaLiteUrlState()

  const hideTabBar = computed({
    get: () => state.value.hideTabBar,
    set: (value: boolean) => {
      void patchState({ hideTabBar: value })
    },
  })

  function toggleHideTabBar(): void {
    hideTabBar.value = !hideTabBar.value
  }

  return {
    hideTabBar,
    toggleHideTabBar,
  }
}

let singleton: ReturnType<typeof useWikitaLiteHideTabBar> | null = null

export function useWikitaLiteHideTabBarSingleton() {
  if (!singleton) {
    singleton = useWikitaLiteHideTabBar()
  }
  return singleton
}
