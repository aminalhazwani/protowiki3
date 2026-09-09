import { normalizeInterestTitles } from '../../../musical-group/data/interests'
import { useWikitaLiteUrlState } from '../../composables/useWikitaLiteUrlState'
import type { OnboardingFlowState, SurveyChoice } from './useWikitaLiteOnboardingFlow'

/** @deprecated Onboarding completion is stored in URL ?onboarded=1 */
export const ONBOARDING_COMPLETE_KEY = 'wikita-lite-onboarding-complete'
/** @deprecated Stored as ?displayName= */
export const ONBOARDING_SURVEY_KEY = 'wikita-lite-onboarding-survey'
/** @deprecated Stored as ?displayName= */
export const ONBOARDING_USERNAME_KEY = 'wikita-lite-onboarding-username'

export function isWikitaLiteOnboardingComplete(): boolean {
  try {
    const { state } = useWikitaLiteUrlState()
    return state.value.onboarded
  } catch {
    return false
  }
}

export function getWikitaLiteOnboardingUsername(): string {
  try {
    const { state } = useWikitaLiteUrlState()
    return state.value.displayName || state.value.username
  } catch {
    return ''
  }
}

export function resetWikitaLiteOnboarding(): void {
  try {
    const { resetState } = useWikitaLiteUrlState()
    void resetState()
  } catch {
    // URL state not initialized — ignore.
  }
}

/** Persist flow outputs into URL state, then mark onboarding complete. */
export function completeWikitaLiteOnboarding(flow: OnboardingFlowState): void {
  const { patchState } = useWikitaLiteUrlState()

  const interests = normalizeInterestTitles(flow.interests.value)
  const username = flow.username.value.trim()
  const survey = flow.survey.value

  void patchState({
    onboarded: true,
    displayName: username || undefined,
    survey: survey || '',
    interests,
    screen: 'read',
    title: '',
    username: '',
    email: '',
    returnTo: '',
    ...(survey ? { mode: survey } : {}),
  })
}

export function loadStoredSurveyChoice(): SurveyChoice | '' {
  try {
    const { state } = useWikitaLiteUrlState()
    return state.value.survey
  } catch {
    return ''
  }
}

/** Persisted onboarding survey maps 1:1 to simplified dashboard mode. */
export function loadStoredDashboardMode(): SurveyChoice | '' {
  return loadStoredSurveyChoice()
}
