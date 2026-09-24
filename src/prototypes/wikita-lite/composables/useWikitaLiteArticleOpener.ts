import { registerArticleOpener } from '@/components/article/shared/articleOpener'

import { articlePagePath } from '../routes'
import { useWikitaLiteRoute } from './useWikitaLiteRoute'

/**
 * Once onboarded, the chrome's search opens articles here — on
 * `/wikita-lite/wiki/:title`, still logged in — instead of leaving for
 * en.wikipedia.org. The onboarding screens register their own opener
 * (`useOnboardingArticleOpener`), which keeps the logged-out flow's screens.
 *
 * `wikitaLiteRoute` carries the current query along, because every wikita-lite
 * navigation has to preserve the params the prototype keeps its state in.
 */
export function useWikitaLiteArticleOpener(): void {
  const { router, wikitaLiteRoute } = useWikitaLiteRoute()

  registerArticleOpener({
    href: (title) => router.resolve(wikitaLiteRoute(articlePagePath(title))).href,
    open: (title) => {
      void router.push(wikitaLiteRoute(articlePagePath(title)))
    },
  })
}
