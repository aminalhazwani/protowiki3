import { computed } from 'vue'

import { MODE_MODULE_ORDER, type SimplifiedModuleId } from '../data/dashboardMode'
import { useWikitaLiteUrlState } from './useWikitaLiteUrlState'

export function useWikitaLiteDashboardMode() {
  const { state } = useWikitaLiteUrlState()

  const dashboardMode = computed(() => state.value.mode)

  const simplifiedModuleOrder = computed((): SimplifiedModuleId[] => {
    return MODE_MODULE_ORDER[dashboardMode.value]
  })

  function simplifiedModuleOrderStyle(moduleId: SimplifiedModuleId): { order: number } | undefined {
    const index = simplifiedModuleOrder.value.indexOf(moduleId)
    if (index === -1) return undefined
    return { order: index }
  }

  return {
    dashboardMode,
    simplifiedModuleOrder,
    simplifiedModuleOrderStyle,
  }
}
