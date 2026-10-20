import { computed, watch, type ComputedRef } from 'vue'

import { useConfig } from '@/composables/useConfig'
import { useRealUserImpact } from './impact/data/useRealUserImpact'
import type { ImpactData } from './impact/data/impactTypes'
import { IMPACT, IMPACT_DESKTOP, IMPACT_PAGE } from './dashpage-fixtures'

type ImpactModuleBind = ImpactData & {
  to?: typeof IMPACT_PAGE
  showRefresh?: boolean
  refreshing?: boolean
  refreshError?: string | null
  loadPending?: boolean
}

function shouldShowLoadPrompt(hasStarted: boolean, hasRenderableData: boolean): boolean {
  return !hasStarted && !hasRenderableData
}

export function useHomepageImpact({
  syncEditedPages = true,
}: {
  /**
   * Copy a real user's fetched edited pages into the Mock user's page lists.
   * PROTOWIKI+ (nov-release) Off there: the Home fetches those pages itself, ahead of Impact.
   */
  syncEditedPages?: boolean
} = {}): {
  impactMobileProps: ComputedRef<ImpactModuleBind>
  impactDesktopProps: ComputedRef<ImpactModuleBind>
  onImpactRefresh: () => void
} {
  const { user, realUsername, realLang, setCurrentUserPageList } = useConfig()
  const realImpact = useRealUserImpact(realUsername, realLang)

  watch(
    [() => user.value, realImpact.editedPageTitles],
    ([activeUser, titles]) => {
      if (syncEditedPages && activeUser === 'real' && titles.length > 0) {
        setCurrentUserPageList('editedPages', [...titles])
      }
    },
    { immediate: true },
  )

  function realUserBind(): ImpactModuleBind {
    if (shouldShowLoadPrompt(realImpact.hasStarted.value, realImpact.hasRenderableData.value)) {
      return {
        loadPending: true,
        refreshing: realImpact.loading.value,
        refreshError: realImpact.error.value,
      }
    }

    return {
      ...realImpact.impactProps.value,
      showRefresh: true,
      refreshing: realImpact.loading.value,
      refreshError: realImpact.error.value,
    }
  }

  const impactMobileProps = computed((): ImpactModuleBind => {
    if (user.value === 'experienced') {
      return { to: IMPACT_PAGE, ...IMPACT, sparklineData: [...IMPACT.sparklineData] }
    }
    if (user.value === 'real') {
      return { to: IMPACT_PAGE, ...realUserBind() }
    }
    return { to: IMPACT_PAGE }
  })

  const impactDesktopProps = computed((): ImpactModuleBind => {
    if (user.value === 'experienced') {
      return { ...IMPACT_DESKTOP }
    }
    if (user.value === 'real') {
      return realUserBind()
    }
    return {}
  })

  function onImpactRefresh(): void {
    if (user.value === 'real') {
      void realImpact.refresh()
    }
  }

  return {
    impactMobileProps,
    impactDesktopProps,
    onImpactRefresh,
  }
}
