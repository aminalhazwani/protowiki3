/**
 * The onboarding wizard after account creation (home2): its steps, in order.
 * The counter ("1 of N") and back / next follow this list, so a step joins the
 * flow by being added here (and to `HomeOnboarding`'s step table).
 */
export const ONBOARDING_STEPS = ['welcome', 'survey', 'interests'] as const

export type OnboardingStep = (typeof ONBOARDING_STEPS)[number]

export function isOnboardingStep(value: unknown): value is OnboardingStep {
  return (ONBOARDING_STEPS as readonly unknown[]).includes(value)
}

/**
 * The survey's answer to "What brings you to Wikipedia?". It picks the default
 * Home layout (`data/homeLayout.ts`), and `read` leaves Mentor unassigned.
 * Skipping (or never answering) counts as `both`.
 */
export const SURVEY_ANSWERS = ['read', 'edit', 'both'] as const

export type SurveyAnswer = (typeof SURVEY_ANSWERS)[number]

export function isSurveyAnswer(value: unknown): value is SurveyAnswer {
  return (SURVEY_ANSWERS as readonly unknown[]).includes(value)
}
