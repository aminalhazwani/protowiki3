import { computed, ref } from 'vue'

import { loadHomeConfig, patchHomeConfig } from './data/homeConfig'
import { ONBOARDING_STEPS, type OnboardingStep, type SurveyAnswer } from './data/onboarding'

// Module-level: the create-account page starts it and the Home's wizard shows it.
// Read on first use, not at import, so it sees `?reset` / `?onboarding=`
// (applied as the Home page sets up).
const step = ref<OnboardingStep | null | undefined>(undefined)
const survey = ref<SurveyAnswer | null | undefined>(undefined)

/**
 * The onboarding wizard after account creation (home2): which step it's on,
 * stored in the Home config so a reload reopens it where the reader was.
 */
export function useHomeOnboarding() {
  if (step.value === undefined || survey.value === undefined) {
    const config = loadHomeConfig()
    step.value = config.onboarding
    survey.value = config.survey
  }

  const current = computed(() => step.value ?? null)
  /** 0-based position in `ONBOARDING_STEPS`; -1 when the wizard is closed. */
  const index = computed(() => (current.value ? ONBOARDING_STEPS.indexOf(current.value) : -1))

  function go(next: OnboardingStep | null): void {
    step.value = patchHomeConfig({ onboarding: next }).onboarding
  }

  return {
    step: current,
    /** The survey's answer, `null` until answered (the layout and Mentor read it as `both`). */
    survey: computed(() => survey.value ?? null),
    setSurvey: (answer: SurveyAnswer) => {
      survey.value = patchHomeConfig({ survey: answer }).survey
    },
    index,
    total: ONBOARDING_STEPS.length,
    /** Open the wizard on its first step (account just created), with the survey unanswered. */
    start: () => {
      survey.value = patchHomeConfig({ survey: null }).survey
      go(ONBOARDING_STEPS[0])
    },
    /** The next step, or close the wizard after the last one. */
    next: () => go(ONBOARDING_STEPS[index.value + 1] ?? null),
    /** The previous step (the first stays put). */
    back: () => go(ONBOARDING_STEPS[Math.max(index.value - 1, 0)]),
    /** Close the wizard; the Home behind it is the reader's now. */
    finish: () => go(null),
  }
}
