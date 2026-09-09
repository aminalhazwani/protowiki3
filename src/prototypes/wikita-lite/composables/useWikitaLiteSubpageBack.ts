import type { RouteLocationRaw } from 'vue-router'
import { useRoute, useRouter } from 'vue-router'

import {
  DEFAULT_WIKITA_LITE_VIEW,
  parseWikitaLiteView,
  WIKITA_LITE_HOME,
} from '../routes'
import { useWikitaLiteRoute } from './useWikitaLiteRoute'
import { useWikitaLiteView } from './useWikitaLiteView'

function dashboardPathFromBackTarget(pathOrUrl: string): string {
  return pathOrUrl.split('?')[0]?.split('#')[0] ?? pathOrUrl
}

export function isWikitaLiteDashboardPath(pathOrUrl: string): boolean {
  const path = dashboardPathFromBackTarget(pathOrUrl)
  return path === WIKITA_LITE_HOME || path === `${WIKITA_LITE_HOME}/`
}

/** Dashboard tab to return to — follows ?view= preserved when opening the subpage. */
export function useWikitaLiteSubpageBack() {
  const route = useRoute()
  const router = useRouter()
  const { wikitaLiteRoute } = useWikitaLiteRoute()
  const { scrollToTop } = useWikitaLiteView()

  function dashboardFallback(): RouteLocationRaw {
    const view = parseWikitaLiteView(route.query.view)
    if (view === DEFAULT_WIKITA_LITE_VIEW) {
      return wikitaLiteRoute(WIKITA_LITE_HOME, { view: null })
    }
    return wikitaLiteRoute(WIKITA_LITE_HOME, { view })
  }

  function canStepBackToDashboard(): boolean {
    const back = window.history.state?.back
    return typeof back === 'string' && isWikitaLiteDashboardPath(back)
  }

  async function goBack(): Promise<void> {
    if (canStepBackToDashboard()) {
      router.back()
      return
    }

    await router.push(dashboardFallback())
    scrollToTop()
  }

  return {
    dashboardFallback,
    canStepBackToDashboard,
    goBack,
  }
}
