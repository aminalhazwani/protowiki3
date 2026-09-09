import { computed } from 'vue'

import {
  isSimplifiedDashboardMode,
  MODE_MODULE_ORDER,
  type SimplifiedModuleId,
} from '../data/dashboardMode'
import { useWikitaLiteUrlState } from './useWikitaLiteUrlState'

export function useWikitaLiteDashboardMode() {
  const { state } = useWikitaLiteUrlState()

  const dashboardMode = computed(() => state.value.mode)

  const isAdvancedMode = computed(() => dashboardMode.value === 'advanced')

  const simplifiedModuleOrder = computed((): SimplifiedModuleId[] => {
    if (!isSimplifiedDashboardMode(dashboardMode.value)) return []
    return MODE_MODULE_ORDER[dashboardMode.value]
  })

  function simplifiedModuleOrderStyle(moduleId: SimplifiedModuleId): { order: number } | undefined {
    const index = simplifiedModuleOrder.value.indexOf(moduleId)
    if (index === -1) return undefined
    return { order: index }
  }

  return {
    dashboardMode,
    isAdvancedMode,
    simplifiedModuleOrder,
    simplifiedModuleOrderStyle,
  }
}
