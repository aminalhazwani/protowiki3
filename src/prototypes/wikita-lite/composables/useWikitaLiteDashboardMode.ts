import { computed } from 'vue'
import { useRoute } from 'vue-router'

import {
  DEFAULT_DASHBOARD_MODE,
  isSimplifiedDashboardMode,
  MODE_MODULE_ORDER,
  parseDashboardMode,
  type SimplifiedModuleId,
  type WikitaLiteDashboardMode,
} from '../data/dashboardMode'
import { loadStoredDashboardMode } from '../onboarding/data/onboardingPersistence'

export function useWikitaLiteDashboardMode() {
  const route = useRoute()

  const urlMode = computed(() => parseDashboardMode(route.query.mode))

  const dashboardMode = computed((): WikitaLiteDashboardMode => {
    const fromUrl = urlMode.value
    if (fromUrl) return fromUrl

    const stored = loadStoredDashboardMode()
    return stored || DEFAULT_DASHBOARD_MODE
  })

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
