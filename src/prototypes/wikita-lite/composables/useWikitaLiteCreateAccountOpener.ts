import { useRoute, useRouter } from 'vue-router'

import { registerCreateAccountOpener } from '@/components/chrome/createAccountOpener'

import { mergeWikitaLiteQuery } from '../data/urlStateSchema'
import { useWikitaLiteOnboardingFlow } from '../onboarding/data/useWikitaLiteOnboardingFlow'
import { useWikitaLiteUrlState } from './useWikitaLiteUrlState'

/**
 * The one way into the create-account screen, wherever it's triggered from:
 * the user menu on mobile, "Create account" in the Vector header on desktop.
 *
 * Both land on `?screen=account`. Leaving Home means the prototype is no
 * longer onboarded — the account screen belongs to the logged-out flow, and
 * `?onboarded=` is what decides which of the two the route renders.
 */
export function useWikitaLiteCreateAccount(): { openCreateAccount: () => Promise<void> } {
  const flow = useWikitaLiteOnboardingFlow()
  const { isOnboarded, patchState } = useWikitaLiteUrlState()

  async function openCreateAccount(): Promise<void> {
    if (isOnboarded.value) {
      await patchState({ onboarded: false })
    }
    await flow.goTo('account')
  }

  return { openCreateAccount }
}

/**
 * Tell the chrome that this prototype has its own create-account experience,
 * so the header link opens it here instead of leaving for en.wikipedia.org.
 *
 * `href` merges into the current query rather than building a fresh one,
 * because every wikita-lite navigation has to preserve the params the
 * prototype keeps its state in — a bare `?screen=account` would drop the lot.
 */
export function useWikitaLiteCreateAccountOpener(): void {
  const route = useRoute()
  const router = useRouter()
  const { openCreateAccount } = useWikitaLiteCreateAccount()

  registerCreateAccountOpener({
    href: () =>
      router.resolve({
        path: route.path,
        query: mergeWikitaLiteQuery(route.query, { onboarded: false, screen: 'account' }),
      }).href,
    open: () => {
      void openCreateAccount()
    },
  })
}
