// PROTOWIKI+ (Home) How a prototype opens a wiki article inside ProtoWiki — ported from home2.
import { onScopeDispose, shallowRef, type ShallowRef } from 'vue'

/**
 * How the page around the chrome opens a wiki article **inside ProtoWiki**.
 *
 * Chrome is generic: the search bar in `VectorChromeHeader` can't know whether
 * the page around it can show any article, and most prototypes can't. One that
 * can registers an opener, and search results stop leaving for the real wiki.
 * With nothing registered, search keeps its default behaviour.
 *
 * Module-level rather than provide/inject: the chrome that renders the search
 * bar sits inside the prototype's own wrapper, which is where the opener lives.
 */
export interface ArticleOpener {
  /**
   * The in-ProtoWiki URL for `title`. Search results are real links, so they
   * need a real `href`: it's what a ⌘- or middle-click opens in a new tab.
   * Plain clicks never follow it; they go through {@link ArticleOpener.open}.
   */
  href(title: string): string
  /** Show `title`, without a page load. */
  open(title: string): void
}

/** The opener the current page registered, or `null` — see {@link ArticleOpener}. */
export const articleOpener: ShallowRef<ArticleOpener | null> = shallowRef(null)

/**
 * Whoever registered last owns the slot. Vue mounts a replacing page before
 * unmounting the one it replaces, so a late teardown must leave the newer
 * registration alone — hence the token.
 */
let owner: symbol | null = null

/** Register an opener for the lifetime of the calling component. Call it in `<script setup>`. */
export function registerArticleOpener(opener: ArticleOpener): void {
  const token = Symbol('article-opener')
  owner = token
  articleOpener.value = opener
  onScopeDispose(() => {
    if (owner !== token) return
    owner = null
    articleOpener.value = null
  })
}
