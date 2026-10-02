import { computed, nextTick, ref } from 'vue'

/*
 * Account creation → Home, told with the View Transition API (proof of concept).
 *
 * In production, Special:CreateAccount and the Home are separate pages at
 * separate URLs. Here they're two routes of one app, so each step is a
 * same-document transition (`document.startViewTransition`) around the route
 * or state change. Production would get the same root crossfade across real
 * page loads by opting both pages in to cross-document transitions
 * (`@view-transition { navigation: auto; }`) and giving the loading status the
 * same `view-transition-name` on both pages, so it holds still while the page
 * underneath swaps.
 *
 * The sequence (`phase`, plus the onboarding wizard's own step):
 *
 * 1. "Create your account" → the form blurs under a status (`creating`).
 * 2. Crossfade to the Home, still blurred, under the same status (`loading`).
 *    It's the not-yet-personalized Home, already loading behind the veil.
 * 3. The wizard opens over the blurred Home, which follows the reader's answers
 *    (layout order, interests) behind it.
 * 4. "Go to your Home" → the wizard fades out to "Setting up your Home"
 *    (`finishing`), then the veil lifts onto the Home. Closing the wizard
 *    instead lifts the veil at once: the Home is already there.
 *
 * Each wait is simulated (`HOME_TRANSITION_DELAY_MS`), standing in for the
 * account and Home requests.
 */

/** How long each simulated load holds. */
export const HOME_TRANSITION_DELAY_MS = 2000

export type HomeTransitionPhase = 'creating' | 'loading' | 'finishing'

/** What the status under the spinner says in each phase. */
const STATUS: Record<HomeTransitionPhase, string> = {
  creating: 'Did you know that Wikipedia is available in 349 languages?',
  loading: 'Did you know that Wikipedia is available in 349 languages?',
  finishing: 'Setting up your Home',
}

// Module-level: it outlives the route change from the form to the Home.
const phase = ref<HomeTransitionPhase | null>(null)

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/**
 * Apply a DOM change as a view transition: the browser snapshots the page,
 * runs `update`, and crossfades to the result (`::view-transition-*(root)`).
 * Without the API, the change just happens.
 */
async function viewTransition(update: () => unknown): Promise<void> {
  const run = async () => {
    await update()
    // Let Vue render the change before the browser snapshots the new state.
    await nextTick()
  }
  if (!document.startViewTransition) {
    await run()
    return
  }
  const transition = document.startViewTransition(run)
  // A skipped animation (e.g. a hidden tab) rejects `ready`; the change still applies.
  transition.ready.catch(() => {})
  await transition.finished
}

export function useHomeTransition() {
  return {
    phase: computed(() => phase.value),
    /** The status under the spinner, while one shows. */
    status: computed(() => (phase.value ? STATUS[phase.value] : null)),

    /**
     * Steps 1–3: blur the form, cross to the (blurred) Home with `goHome`,
     * hold while it loads, then hand over to the wizard.
     */
    async createAccount(goHome: () => Promise<unknown>): Promise<void> {
      await viewTransition(() => (phase.value = 'creating'))
      await wait(HOME_TRANSITION_DELAY_MS)
      await viewTransition(async () => {
        await goHome()
        phase.value = 'loading'
      })
      await wait(HOME_TRANSITION_DELAY_MS)
      await viewTransition(() => (phase.value = null))
    },

    /** Step 4, "Go to your Home": `close` the wizard, set up the Home, lift the veil. */
    async finishOnboarding(close: () => void): Promise<void> {
      await viewTransition(() => {
        close()
        phase.value = 'finishing'
      })
      await wait(HOME_TRANSITION_DELAY_MS)
      await viewTransition(() => (phase.value = null))
    },

    /** The wizard closed early: the Home behind it is ready, so lift the veil at once. */
    skipOnboarding(close: () => void): Promise<void> {
      return viewTransition(close)
    },
  }
}
