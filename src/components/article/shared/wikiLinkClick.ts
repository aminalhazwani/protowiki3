/**
 * Resolves a click inside rendered article HTML (Parsoid body from
 * **`ArticleLive`** / **`ArticleSnapshot`**, or hand-authored parser markup)
 * into the wiki article it points at — so a prototype can load the destination
 * in place instead of leaving for the real wiki.
 *
 * Parsoid marks article links **`rel="mw:WikiLink"`**; interwiki links get
 * **`mw:WikiLink/Interwiki`** and external ones **`mw:ExtLink`**, so the `rel`
 * token alone separates "stays on this wiki" from "leaves it". Hand-written
 * markup has no `rel`, so **`/wiki/Title`** and absolute Wikipedia URLs are
 * recognised too.
 */

/** Namespaces that exist on the wiki but have no readable article to render here. */
const NON_ARTICLE_NAMESPACES = [
  'media',
  'special',
  'talk',
  'user',
  'wikipedia',
  'project',
  'file',
  'image',
  'mediawiki',
  'template',
  'help',
  'category',
  'portal',
  'draft',
  'timedtext',
  'module',
  'book',
  'education program',
  'gadget',
  'gadget definition',
  'topic',
]

export type WikiLinkClick =
  /** A readable article on the same wiki — load it in place. */
  | { kind: 'article'; title: string; fragment: string | null }
  /** On-wiki but not renderable here (a file page, a category, a red link, `Special:`). */
  | { kind: 'wiki-other' }
  /** Not a wiki link: external link, in-page fragment, or no anchor at all. */
  | null

function isArticleTitle(title: string): boolean {
  const colon = title.indexOf(':')
  if (colon <= 0) return true
  const prefix = title.slice(0, colon).trim().toLowerCase().replace(/_/g, ' ')
  // Talk namespaces are `<namespace> talk:`, so match the trailing word too.
  const base = prefix.replace(/ talk$/, '')
  return !NON_ARTICLE_NAMESPACES.includes(base)
}

/** Percent-decoding that keeps a malformed escape rather than throwing on it. */
function decodeOrRaw(value: string): string {
  try {
    return decodeURIComponent(value)
  } catch {
    return value
  }
}

/**
 * The fragment comes back decoded: Parsoid percent-encodes anything outside
 * ASCII (`#Königreich` → `#K%C3%B6nigreich`), and `getElementById` wants the id
 * the heading actually carries.
 */
function splitFragment(path: string): { path: string; fragment: string | null } {
  const hash = path.indexOf('#')
  if (hash === -1) return { path, fragment: null }
  const fragment = path.slice(hash + 1)
  return { path: path.slice(0, hash), fragment: fragment ? decodeOrRaw(fragment) : null }
}

function decodeTitle(path: string): string | null {
  const [withoutQuery] = path.split('?')
  if (!withoutQuery) return null
  const title = decodeOrRaw(withoutQuery).replace(/_/g, ' ').trim()
  return title || null
}

/** The wiki path (`Title#Fragment`) a link points at, or `null` when it leaves the wiki. */
function wikiPathFromHref(raw: string): string | null {
  if (raw.startsWith('./')) return raw.slice(2)
  if (raw.startsWith('/wiki/')) return raw.slice('/wiki/'.length)

  let url: URL
  try {
    url = new URL(raw, window.location.href)
  } catch {
    return null
  }
  if (!/(^|\.)wikipedia\.org$/.test(url.hostname)) return null
  const match = url.pathname.match(/^\/wiki\/(.+)$/)
  if (!match) return null
  return match[1] + url.search + url.hash
}

/**
 * Classify a click delegated from an article container. Callers
 * **`preventDefault()`** on both wiki cases — the relative Parsoid hrefs mean
 * every on-wiki link is broken navigation inside a prototype.
 */
export function wikiLinkClick(event: MouseEvent): WikiLinkClick {
  const target = event.target
  if (!(target instanceof Element)) return null

  const anchor = target.closest('a')
  if (!anchor) return null

  const href = anchor.getAttribute('href')
  if (!href) return null
  // Footnote / heading jumps and TemplateStyles blobs are already fine as-is.
  if (href.startsWith('#') || href.startsWith('mw-data:')) return null

  const rel = (anchor.getAttribute('rel') ?? '').split(/\s+/)
  if (
    rel.includes('mw:WikiLink/Interwiki') ||
    rel.some((token) => token.startsWith('mw:ExtLink'))
  ) {
    return null
  }

  const wikiPath = wikiPathFromHref(href)
  if (wikiPath === null) return rel.includes('mw:WikiLink') ? { kind: 'wiki-other' } : null

  // Red links (`?action=edit&redlink=1`) and file / category pages have nothing to render.
  if (/[?&](action|redlink)=/.test(wikiPath) || anchor.classList.contains('new')) {
    return { kind: 'wiki-other' }
  }

  const { path, fragment } = splitFragment(wikiPath)
  const title = decodeTitle(path)
  if (!title) return null
  if (!isArticleTitle(title)) return { kind: 'wiki-other' }

  return { kind: 'article', title, fragment }
}

/** Same-title check that tolerates underscores, stray spaces and case on the first letter. */
export function sameWikiTitle(a: string, b: string): boolean {
  const normalize = (value: string) =>
    value
      .trim()
      .replace(/_/g, ' ')
      .replace(/\s+/g, ' ')
      .replace(/^./, (c) => c.toUpperCase())
  return normalize(a) === normalize(b)
}
