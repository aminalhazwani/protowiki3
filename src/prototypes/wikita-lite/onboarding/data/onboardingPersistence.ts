import { saveInterests } from '../../../musical-group/data/interests'
import type { OnboardingFlowState, SurveyChoice } from './useWikitaLiteOnboardingFlow'

export const ONBOARDING_COMPLETE_KEY = 'wikita-lite-onboarding-complete'
export const ONBOARDING_SURVEY_KEY = 'wikita-lite-onboarding-survey'
export const ONBOARDING_USERNAME_KEY = 'wikita-lite-onboarding-username'

export function isWikitaLiteOnboardingComplete(): boolean {
  if (typeof window === 'undefined') return true
  try {
    return window.localStorage.getItem(ONBOARDING_COMPLETE_KEY) === '1'
  } catch {
    return true
  }
}

export function getWikitaLiteOnboardingUsername(): string {
  if (typeof window === 'undefined') return ''
  try {
    return window.localStorage.getItem(ONBOARDING_USERNAME_KEY)?.trim() ?? ''
  } catch {
    return ''
  }
}

export function resetWikitaLiteOnboarding(): void {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.removeItem(ONBOARDING_COMPLETE_KEY)
    window.localStorage.removeItem(ONBOARDING_SURVEY_KEY)
    window.localStorage.removeItem(ONBOARDING_USERNAME_KEY)
  } catch {
    // Private mode — ignore.
  }
}

function writeStorage(key: string, value: string): void {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(key, value)
  } catch {
    // Private mode — ignore.
  }
}

/** Persist flow outputs into wikita-lite stores, then mark onboarding complete. */
export function completeWikitaLiteOnboarding(flow: OnboardingFlowState): void {
  const interests = flow.interests.value
  if (interests.length) {
    saveInterests(interests)
  }

  const username = flow.username.value.trim()
  if (username) {
    writeStorage(ONBOARDING_USERNAME_KEY, username)
  }

  const survey = flow.survey.value
  if (survey) {
    writeStorage(ONBOARDING_SURVEY_KEY, survey)
  }

  writeStorage(ONBOARDING_COMPLETE_KEY, '1')
}

export function loadStoredSurveyChoice(): SurveyChoice | '' {
  if (typeof window === 'undefined') return ''
  try {
    const raw = window.localStorage.getItem(ONBOARDING_SURVEY_KEY) ?? ''
    return raw === 'read' || raw === 'edit' || raw === 'both' ? raw : ''
  } catch {
    return ''
  }
}

/** Persisted onboarding survey maps 1:1 to simplified dashboard mode. */
export function loadStoredDashboardMode(): SurveyChoice | '' {
  return loadStoredSurveyChoice()
}
