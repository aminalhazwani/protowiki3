/**
 * The onboarding wizard after account creation (home2): its steps, in order.
 * The counter ("1 of N") and back / next follow this list, so a step joins the
 * flow by being added here (and to `HomeOnboarding`'s step table).
 *
 * Next: `survey` (F5), then `interests` (F6).
 */
export const ONBOARDING_STEPS = ['welcome'] as const

export type OnboardingStep = (typeof ONBOARDING_STEPS)[number]

export function isOnboardingStep(value: unknown): value is OnboardingStep {
  return (ONBOARDING_STEPS as readonly unknown[]).includes(value)
}
