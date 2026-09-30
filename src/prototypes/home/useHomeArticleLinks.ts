import { useRouter } from 'vue-router'

import { resolveArticleLink } from './data/articleLinks'
import { homeArticleLocation, normalizeTitle } from './routes'
import { useHomeLeavePrototype } from './useHomeLeavePrototype'

/** Scroll to a heading / footnote id from a link fragment. */
export function scrollToFragment(fragment: string): void {
  let id = fragment
  try {
    id = decodeURIComponent(fragment)
  } catch {
    // Keep the raw fragment.
  }
  document.getElementById(id)?.scrollIntoView({ block: 'start' })
}

/**
 * Click handler for a rendered article body: article links stay inside the
 * prototype (`/home/wiki/Title`), other wiki pages and external links go through
 * the leave-prototype dialog (then open in a new tab), red links do nothing.
 * Attach it to an element that wraps the article; clicks outside
 * `.mw-parser-output` are left alone.
 */
export function useHomeArticleLinks(currentTitle: () => string) {
  const router = useRouter()
  const { requestLeave } = useHomeLeavePrototype()

  function onArticleClick(event: MouseEvent): void {
    if (event.defaultPrevented || event.button !== 0) return
    const anchor = (event.target as Element | null)?.closest?.('a')
    if (!anchor || !anchor.closest('.mw-parser-output')) return

    const target = resolveArticleLink(anchor)
    if (target.kind === 'in-page') return

    event.preventDefault()
    if (target.kind === 'inert') return

    if (target.kind === 'external') {
      requestLeave(target.href)
      return
    }

    // Footnotes and section links come as `./Same_page#id`.
    if (normalizeTitle(target.title) === normalizeTitle(currentTitle())) {
      if (target.fragment) scrollToFragment(target.fragment)
      return
    }

    const location = homeArticleLocation(target.title, target.fragment)
    if (event.metaKey || event.ctrlKey || event.shiftKey) {
      window.open(router.resolve(location).href, '_blank', 'noopener')
      return
    }
    void router.push(location)
  }

  return { onArticleClick }
}
