import { computed, watch, type ComputedRef } from 'vue'

import { useConfig } from '@/composables/useConfig'
import { useRealUserImpact } from '../../template-homepage/impact/data/useRealUserImpact'
import type { ImpactData } from '../../template-homepage/impact/data/impactTypes'
import { withFictionalImpactFallbacks } from '../data/fictionalImpact'
import { WIKITA_LITE_IMPACT, WIKITA_LITE_IMPACT_FULL } from '../data/impactFixtures'
import { useWikitaLiteUrlState } from './useWikitaLiteUrlState'

type ImpactModuleBind = ImpactData & {
  empty?: boolean
  showRefresh?: boolean
  refreshing?: boolean
  refreshError?: string | null
}

function isLiveImpactEmpty(hasRenderableData: boolean, loading: boolean): boolean {
  return !loading && !hasRenderableData
}

export function useWikitaLiteImpact(): {
  showImpact: ComputedRef<boolean>
  impactCardProps: ComputedRef<ImpactModuleBind>
  impactPageProps: ComputedRef<ImpactModuleBind>
  showRealRefresh: ComputedRef<boolean>
  impactLoading: ComputedRef<boolean>
  impactHasContent: ComputedRef<boolean>
  onImpactRefresh: () => void
} {
  const { user, realUsername, realLang, setCurrentUserPageList } = useConfig()
  const { state: urlState } = useWikitaLiteUrlState()

  /**
   * Username fetched via Advanced personalization for a non-real persona.
   * Clearing the edited pages list drops it too.
   */
  const fetchedUsername = computed(() =>
    user.value !== 'real' && urlState.value.edited.length > 0 ? urlState.value.editedFrom : '',
  )
  /** Real user, or a persona with a fetched username: impact comes from the wiki. */
  const isLive = computed(() => user.value === 'real' || !!fetchedUsername.value)

  const impactUsername = computed(() =>
    user.value === 'real' ? realUsername.value : fetchedUsername.value,
  )
  // "Fetch editing history" only queries English Wikipedia.
  const impactWiki = computed(() => (user.value === 'real' ? realLang.value : 'en'))
  const realImpact = useRealUserImpact(impactUsername, impactWiki)

  watch(
    [() => user.value, realImpact.editedPageTitles],
    ([activeUser, titles]) => {
      if (activeUser === 'real' && titles.length > 0) {
        setCurrentUserPageList('editedPages', [...titles])
      }
    },
    { immediate: true },
  )

  watch(
    [isLive, () => realImpact.hasStarted.value],
    ([live, hasStarted]) => {
      if (live && !hasStarted) {
        void realImpact.refresh()
      }
    },
    { immediate: true },
  )

  const showImpact = computed(() => true)

  const impactLoading = computed(() => isLive.value && realImpact.loading.value)

  const impactHasContent = computed(() => {
    if (isLive.value) {
      if (realImpact.loading.value && !realImpact.hasRenderableData.value) {
        return false
      }
    }
    return true
  })

  function realUserBind(): ImpactModuleBind {
    const data = realImpact.impactProps.value
    return {
      // Stats the APIs can't provide get fictional numbers once loading settles,
      // so real values arriving late don't flash over fake ones.
      ...(realImpact.loading.value
        ? { ...data, viewCount: data.viewCount ?? '—' }
        : withFictionalImpactFallbacks(data, impactUsername.value)),
      showRefresh: true,
      refreshing: realImpact.loading.value,
      refreshError: realImpact.error.value,
    }
  }

  const impactCardProps = computed((): ImpactModuleBind => {
    if (isLive.value) {
      return {
        ...realUserBind(),
        empty: isLiveImpactEmpty(realImpact.hasRenderableData.value, realImpact.loading.value),
      }
    }
    if (user.value === 'experienced') {
      return {
        ...WIKITA_LITE_IMPACT,
        sparklineData: [...WIKITA_LITE_IMPACT.sparklineData],
        empty: false,
      }
    }
    return { empty: true }
  })

  const impactPageProps = computed((): ImpactModuleBind => {
    if (isLive.value) {
      return {
        ...realUserBind(),
        empty: isLiveImpactEmpty(realImpact.hasRenderableData.value, realImpact.loading.value),
      }
    }
    if (user.value === 'experienced') {
      return { ...WIKITA_LITE_IMPACT_FULL, empty: false }
    }
    return { empty: true }
  })

  const showRealRefresh = computed(() => isLive.value && realImpact.hasStarted.value)

  function onImpactRefresh(): void {
    if (isLive.value) {
      void realImpact.refresh()
    }
  }

  return {
    showImpact,
    impactCardProps,
    impactPageProps,
    showRealRefresh,
    impactLoading,
    impactHasContent,
    onImpactRefresh,
  }
}
