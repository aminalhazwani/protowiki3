/**
 * Classifies anchors inside the Parsoid article HTML (the `v-html` body rendered
 * by `ReadScreen`). The Main Page and every article ship Wikipedia's own links:
 * internal ones as `<a rel="mw:WikiLink" href="./Title" title="Title">`, external
 * ones as `<a rel="mw:ExtLink" href="https://…">`. We keep the reading experience
 * self-contained, so only real (main-namespace) articles are openable inside the
 * prototype — namespaced pages (Special:, Help:, File:, …) and external links are
 * intentionally inert.
 */

/**
 * Namespace prefixes that are NOT readable articles. Lowercased; matched against
 * the segment before the first colon. Any prefix ending in ` talk` (e.g.
 * `user talk`, `wikipedia talk`) is also treated as a namespace.
 */
export const NON_ARTICLE_NAMESPACES = new Set<string>([
  'special',
  'media',
  'file',
  'image',
  'category',
  'template',
  'help',
  'portal',
  'wikipedia',
  'wp',
  'project',
  'draft',
  'module',
  'mediawiki',
  'book',
  'timedtext',
  'gadget',
  'user',
  'talk',
])

function isNonArticleNamespace(title: string): boolean {
  const colon = title.indexOf(':')
  if (colon <= 0) return false
  const prefix = title.slice(0, colon).trim().toLowerCase()
  return NON_ARTICLE_NAMESPACES.has(prefix) || prefix.endsWith(' talk')
}

export type ArticleLinkTarget =
  /** A readable article to open inside the prototype (may carry a section fragment). */
  | { kind: 'article'; title: string; fragment: string | null }
  /** A same-page jump the browser should handle natively (bare `#…` link). */
  | { kind: 'in-page' }
  /** External link or non-article namespace — the caller keeps it inert. */
  | { kind: 'inert' }

function decodePath(path: string): string {
  let out: string
  try {
    out = decodeURIComponent(path)
  } catch {
    out = path
  }
  return out.replace(/_/g, ' ').trim()
}

/**
 * Classifies a clicked anchor from the article HTML so `ReadScreen` can decide
 * how to handle it — open the target article in-prototype, let the browser scroll
 * to an in-page fragment, or leave it inert (external / non-article namespace).
 *
 * Note: Parsoid emits same-page footnote/section links as page-relative hrefs like
 * `./Messier_87#cite_note-14` (the discarded `<base>` would have anchored them), so
 * an article target can also carry a `fragment` the caller scrolls to when it points
 * at the current page.
 */
export function resolveArticleLink(anchor: HTMLAnchorElement): ArticleLinkTarget {
  const href = anchor.getAttribute('href') ?? ''

  // Bare in-page fragment: let the browser scroll; no route change, no title.
  if (href.startsWith('#')) return { kind: 'in-page' }

  // Only Parsoid internal wiki links are readable. Everything else — external
  // `mw:ExtLink`, absolute/protocol-relative URLs — is inert.
  const rel = anchor.getAttribute('rel') ?? ''
  const isWikiLink = rel.split(/\s+/).includes('mw:WikiLink') || href.startsWith('./')
  if (!isWikiLink) return { kind: 'inert' }

  // Derive the title from the href — it is the canonical page target. The `title`
  // attribute is unreliable here: image links (`./File:…`) carry the caption as
  // their title, which would hide the `File:` namespace and open a bogus page.
  const withoutPrefix = href.replace(/^\.\//, '')
  const hashIndex = withoutPrefix.indexOf('#')
  const fragment = hashIndex >= 0 ? withoutPrefix.slice(hashIndex + 1) : null
  const title = decodePath(withoutPrefix.split(/[#?]/)[0])

  if (!title || isNonArticleNamespace(title)) return { kind: 'inert' }

  return { kind: 'article', title, fragment: fragment || null }
}
