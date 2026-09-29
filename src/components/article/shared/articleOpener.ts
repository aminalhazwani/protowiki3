import { onScopeDispose, shallowRef, type ShallowRef } from 'vue'

/**
 * How the surrounding prototype opens a wiki article **inside ProtoWiki** —
 * the counterpart, for chrome affordances, of what
 * {@link wikiLinkClick} does for links inside article HTML.
 *
 * Chrome is generic: the search bar in `VectorChromeHeader` has no idea whether
 * the page around it can render an arbitrary article, and most prototypes
 * can't. So a prototype that *can* — one that keeps the article it shows in
 * `?article=`, say — registers an opener, and search results stop being links
 * to en.wikipedia.org and start moving the prototype instead. Nothing
 * registered (a dashboard, a special page, a hand-authored article) and search
 * keeps its default behaviour: it leaves for the real wiki.
 *
 * Module-level rather than provide/inject, for the same reason as
 * `chrome/stickyHeaderSubject`: the prototype that owns the reading position
 * and the chrome that renders the search bar are siblings, not ancestor and
 * descendant.
 */
export interface ArticleOpener {
  /**
   * The in-ProtoWiki URL for `title`. Search results are real links, so they
   * need a real `href`: it's what a middle- or ⌘-click opens in a new tab, and
   * what the browser shows in the status bar. Plain clicks never reach it —
   * they're intercepted and routed through {@link ArticleOpener.open}.
   */
  href(title: string): string
  /** Show `title` in place, without a page load. */
  open(title: string): void
}

/** The opener the current page registered, or `null` — see {@link ArticleOpener}. */
export const articleOpener: ShallowRef<ArticleOpener | null> = shallowRef(null)

/**
 * Whoever registered last owns the slot. Vue mounts a replacing component
 * before unmounting the one it replaces, so a teardown that arrives after a
 * newer registration must leave that registration alone — hence the token.
 */
let owner: symbol | null = null

/** Publish (or update) the page's opener. Call with a stable per-instance token. */
function setArticleOpener(token: symbol, opener: ArticleOpener): void {
  owner = token
  articleOpener.value = opener
}

/** Withdraw the opener, unless something else has since taken over. */
function clearArticleOpener(token: symbol): void {
  if (owner !== token) return
  owner = null
  articleOpener.value = null
}

/**
 * Register an opener for the lifetime of the calling component — the form
 * prototypes use. Call it in `<script setup>`.
 */
export function registerArticleOpener(opener: ArticleOpener): void {
  const token = Symbol('article-opener')
  setArticleOpener(token, opener)
  onScopeDispose(() => clearArticleOpener(token))
}
