import { ref, type Ref } from 'vue'

/**
 * What the desktop sticky header shows once the page has scrolled: the title of
 * whatever the page is *about*, plus the element whose leaving the viewport
 * triggers the slide-in.
 *
 * Module-level rather than provide/inject, following `@/theme` and
 * `./homeButtonPlayground`: the article surface that owns the title
 * (`ArticleHeader`) and the chrome that renders the bar (`VectorChromeHeader`)
 * are siblings, not ancestor and descendant, so there's no shared provider to
 * hang it off. Nothing registers on a page with no article — the bar then
 * falls back to the site header as its trigger and renders title-free.
 */
export interface StickyHeaderSubject {
  /** Reader-visible page title, already trimmed. */
  title: string
  /**
   * The on-page heading. The bar appears once this has scrolled above the
   * viewport top, which is what Vector 2022 does.
   */
  sentinel: HTMLElement | null
  /** Count behind the interlanguage control's “N languages” label. */
  languagesCount?: number
}

export const stickyHeaderTitle = ref('')
export const stickyHeaderSentinel: Ref<HTMLElement | null> = ref(null)
export const stickyHeaderLanguagesCount: Ref<number | undefined> = ref(undefined)

/**
 * Whoever registered last owns the state. Vue mounts a replacing component
 * before unmounting the one it replaces, so an unmount that arrives after a
 * newer registration must leave that registration alone — hence the token.
 */
let owner: symbol | null = null

/** Publish (or update) the page subject. Call with a stable per-instance token. */
export function setStickyHeaderSubject(token: symbol, subject: StickyHeaderSubject): void {
  owner = token
  stickyHeaderTitle.value = subject.title
  stickyHeaderSentinel.value = subject.sentinel
  stickyHeaderLanguagesCount.value = subject.languagesCount
}

/** Withdraw the page subject, unless something else has since taken over. */
export function clearStickyHeaderSubject(token: symbol): void {
  if (owner !== token) return
  owner = null
  stickyHeaderTitle.value = ''
  stickyHeaderSentinel.value = null
  stickyHeaderLanguagesCount.value = undefined
}
