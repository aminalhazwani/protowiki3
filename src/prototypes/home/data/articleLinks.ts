/**
 * Classifies anchors in Parsoid article HTML (REST `page/html`). Internal links
 * arrive as `<a rel="mw:WikiLink" href="./Title">`, external ones as
 * `<a rel="mw:ExtLink" href="https://…">`. Only main-namespace articles open
 * inside the prototype; everything else still works, on the real wiki.
 */

import { normalizeTitle } from '../routes'

export type ArticleLinkTarget =
  /** A readable article to open inside the prototype (may carry a section fragment). */
  | { kind: 'article'; title: string; fragment: string | null }
  /** A bare `#…` jump the browser handles natively. */
  | { kind: 'in-page' }
  /** A page outside the prototype — opened in a new tab. */
  | { kind: 'external'; href: string }
  /** Nothing to open (red link, empty href). */
  | { kind: 'inert' }

/** Namespaces that aren't readable articles (lowercased, before the first colon). */
const NON_ARTICLE_NAMESPACES = new Set([
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

export function resolveArticleLink(
  anchor: HTMLAnchorElement,
  host = 'en.wikipedia.org',
): ArticleLinkTarget {
  const href = anchor.getAttribute('href') ?? ''
  if (!href) return { kind: 'inert' }
  if (href.startsWith('#')) return { kind: 'in-page' }

  // Red links point at pages that don't exist yet.
  if (anchor.classList.contains('new') || href.includes('redlink=1')) return { kind: 'inert' }

  if (href.startsWith('./')) {
    // The href is the canonical target; `title` on image links is the caption.
    const path = href.slice(2)
    const hashIndex = path.indexOf('#')
    const fragment = hashIndex >= 0 ? path.slice(hashIndex + 1) : null
    const title = normalizeTitle(path.split(/[#?]/)[0])
    if (!title) return { kind: 'inert' }
    if (isNonArticleNamespace(title)) {
      return { kind: 'external', href: `https://${host}/wiki/${path}` }
    }
    return { kind: 'article', title, fragment: fragment || null }
  }

  if (href.startsWith('//')) return { kind: 'external', href: `https:${href}` }
  if (/^https?:\/\//i.test(href)) return { kind: 'external', href }
  return { kind: 'inert' }
}
