// PROTOWIKI+ (Home) Account actions a prototype can hand to the chrome's account menus.
import { onScopeDispose, shallowRef, type ShallowRef } from 'vue'

/**
 * What the page around the chrome does when the reader acts on their account.
 *
 * Chrome is generic: the user menu in `VectorChromeHeader` can't know whether
 * the prototype has a signed-in state of its own, and most don't. One that
 * does registers its actions, and the matching menu rows start working. With
 * nothing registered (or an action left out), those rows stay inert mocks.
 *
 * Module-level rather than provide/inject, like `articleOpener`: the chrome
 * sits inside the prototype's own wrapper, which is where the actions live.
 */
export interface AccountActions {
  /** The user menu's "Log out" row. */
  logOut?(): void
  /** The logged-out "Create account" link: the prototype's own account flow. */
  createAccount?: {
    /**
     * The in-ProtoWiki URL for that flow. The link stays a real `<a>`, so it
     * needs a real `href`: it's what a ⌘- or middle-click opens in a new tab.
     * Plain clicks never follow it; they go through `open`.
     */
    href(): string
    /** Start the flow in place, without a page load. */
    open(): void
  }
}

/** The actions the current page registered, or `null` — see {@link AccountActions}. */
export const accountActions: ShallowRef<AccountActions | null> = shallowRef(null)

/**
 * Whoever registered last owns the slot. Vue mounts a replacing page before
 * unmounting the one it replaces, so a late teardown must leave the newer
 * registration alone — hence the token.
 */
let owner: symbol | null = null

/** Register actions for the lifetime of the calling component. Call it in `<script setup>`. */
export function registerAccountActions(actions: AccountActions): void {
  const token = Symbol('account-actions')
  owner = token
  accountActions.value = actions
  onScopeDispose(() => {
    if (owner !== token) return
    owner = null
    accountActions.value = null
  })
}
