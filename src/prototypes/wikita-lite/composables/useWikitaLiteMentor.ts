import { computed } from 'vue'

import { MENTOR_MODULE_TITLES } from '../data/mentorContent'
import { useWikitaLiteDashboardMode } from './useWikitaLiteDashboardMode'
import { useWikitaLiteUrlState } from './useWikitaLiteUrlState'

export function useWikitaLiteMentor() {
  const { state, patchState } = useWikitaLiteUrlState()
  const { dashboardMode } = useWikitaLiteDashboardMode()

  const mentorAssignedOverride = computed(() => state.value.mentorAssigned)
  const bannerDismissed = computed(() => state.value.mentorBannerDismissed)

  const isAssigned = computed(() => {
    const override = mentorAssignedOverride.value
    if (override !== null) return override
    return dashboardMode.value !== 'read'
  })

  const moduleTitle = computed(() =>
    isAssigned.value ? MENTOR_MODULE_TITLES.assigned : MENTOR_MODULE_TITLES.unassigned,
  )

  function assignMentor(): void {
    void patchState({ mentorAssigned: true })
  }

  function dismissBanner(): void {
    void patchState({ mentorBannerDismissed: true })
  }

  return {
    isAssigned,
    moduleTitle,
    bannerDismissed,
    assignMentor,
    dismissBanner,
  }
}
