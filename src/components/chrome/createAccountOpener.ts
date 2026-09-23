import { onScopeDispose, shallowRef, type ShallowRef } from 'vue'

/**
 * How the surrounding prototype opens its **own** create-account experience —
 * the chrome counterpart, for the logged-out links in the Vector header, of
 * what {@link ArticleOpener} does for search results.
 *
 * Chrome is generic: the "Create account" link in `VectorChromeHeader` has no
 * idea whether the prototype around it has an account flow to show, and most
 * don't. So a prototype that *does* registers an opener, and the link stops
 * being a link to `Special:CreateAccount` on en.wikipedia.org and starts moving
 * the prototype instead. Nothing registered and the link keeps its default
 * behaviour: it leaves for the real wiki.
 *
 * Module-level rather than provide/inject, for the same reason as
 * {@link articleOpener}: the prototype that owns the flow and the chrome that
 * renders the header are siblings, not ancestor and descendant.
 */
export interface CreateAccountOpener {
  /**
   * The in-ProtoWiki URL for the create-account screen. The header renders a
   * real `<a>`, so it needs a real `href`: it's what a ⌘-click opens in a new
   * tab and what the browser shows in the status bar. Plain clicks never reach
   * it — they're intercepted and routed through {@link CreateAccountOpener.open}.
   */
  href(): string
  /** Show the create-account screen in place, without a page load. */
  open(): void
}

/** The opener the current prototype registered, or `null`. */
export const createAccountOpener: ShallowRef<CreateAccountOpener | null> = shallowRef(null)

/**
 * Whoever registered last owns the slot. Vue mounts a replacing component
 * before unmounting the one it replaces, so a teardown that arrives after a
 * newer registration must leave that registration alone — hence the token.
 */
let owner: symbol | null = null

function setCreateAccountOpener(token: symbol, opener: CreateAccountOpener): void {
  owner = token
  createAccountOpener.value = opener
}

function clearCreateAccountOpener(token: symbol): void {
  if (owner !== token) return
  owner = null
  createAccountOpener.value = null
}

/**
 * Register an opener for the lifetime of the calling component — the form
 * prototypes use. Call it in `<script setup>`.
 */
export function registerCreateAccountOpener(opener: CreateAccountOpener): void {
  const token = Symbol('create-account-opener')
  setCreateAccountOpener(token, opener)
  onScopeDispose(() => clearCreateAccountOpener(token))
}
