import { useRoute, useRouter } from 'vue-router'

import { registerArticleOpener } from '@/components/article/shared/articleOpener'

import type { FlowState } from './useWikitaLiteOnboardingFlow'

/**
 * Tell the chrome's search bars that this screen can render any article, so a
 * result opens here instead of leaving for en.wikipedia.org.
 *
 * `href` spreads the current query rather than building one, because every
 * wikita-lite navigation has to preserve the params the prototype keeps its
 * state in — a bare `?screen=article&title=` would drop the lot.
 *
 * `onOpen` lets a caller notice a pick. The search screen needs it: the overlay
 * reports a chosen row and the back button the same way, and only the second
 * should step back through history.
 */
export function useOnboardingArticleOpener(
  flow: FlowState,
  onOpen?: (title: string) => void,
): void {
  const route = useRoute()
  const router = useRouter()

  registerArticleOpener({
    href: (title) => router.resolve({ query: { ...route.query, screen: 'article', title } }).href,
    open: (title) => {
      onOpen?.(title)
      void flow.goTo('article', { title })
    },
  })
}
