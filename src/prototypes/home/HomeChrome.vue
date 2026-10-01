<script setup lang="ts">
/**
 * Wikipedia chrome for every Home page: the wordmark leads back to `/home`, the
 * header follows the prototype's account (see `useHomeSession`), search opens
 * articles inside the prototype, and any link off the prototype (header or
 * content) asks before leaving.
 */
import { useRouter } from 'vue-router'

import { registerArticleOpener } from '@/components/article/shared/articleOpener'
import { registerAccountActions } from '@/components/chrome/accountActions'
import ChromeWrapper from '@/components/chrome/ChromeWrapper.vue'
import type { ChromeNavTool } from '@/components/chrome/headerNavTools'

import HomeLeavePrototypeDialog from './HomeLeavePrototypeDialog.vue'
import { HOME_PATH, homeArticleLocation } from './routes'
import { useHomeSession } from './useHomeAccount'
import { useHomeLeavePrototype } from './useHomeLeavePrototype'

interface Props {
  /** Footer "last edited" notice — on for wiki pages, off for the Home dashboard. */
  lastEditedNotice?: boolean
  /** Module pages take over the screen: no footer, and their own bar for a header. */
  showFooter?: boolean
}

const props = withDefaults(defineProps<Props>(), { lastEditedNotice: true, showFooter: true })

/** Signed-in Vector tools: Home leads, and the account's name labels the user menu. */
const NAV_TOOLS: ChromeNavTool[] = [
  'home',
  'appearance',
  'notifications',
  'notices',
  'bookmarks',
  'watchlist',
  'user-menu',
]

const { logIn, logOut } = useHomeSession()
const { onLeaveCapture } = useHomeLeavePrototype()

const router = useRouter()
registerArticleOpener({
  href: (title) => router.resolve(homeArticleLocation(title)).href,
  open: (title) => void router.push(homeArticleLocation(title)),
})

/*
 * Go to `/home` and switch the account there, wherever the reader was. The
 * switch happens as the route commits, not before: the setting change rewrites
 * `?user=` on the current route, and that replace would cancel the navigation.
 * Not after either, or the wrong Home would mount (and fetch) first.
 * `afterEach` runs before the new page renders, and also on a duplicate push.
 */
function goHomeAs(switchAccount: () => void): void {
  const stop = router.afterEach(() => {
    stop()
    switchAccount()
  })
  void router.push(HOME_PATH)
}

registerAccountActions({
  // Logging out lands on the logged-out Main Page.
  logOut: () => goHomeAs(logOut),
  // Placeholder until onboarding (Phase F): sign straight in as a new account.
  createAccount: {
    href: () => router.resolve({ path: HOME_PATH, query: { user: 'new' } }).href,
    open: () => goHomeAs(() => logIn()),
  },
})
</script>

<template>
  <div @click.capture="onLeaveCapture">
    <ChromeWrapper
      :brand-to="HOME_PATH"
      :nav-tools="NAV_TOOLS"
      :last-edited-notice="props.lastEditedNotice"
      :show-footer="props.showFooter"
    >
      <!-- A page's own header (a module page's back bar) replaces the wiki header. -->
      <template v-if="$slots.header" #header>
        <slot name="header" />
      </template>
      <slot />
    </ChromeWrapper>
    <HomeLeavePrototypeDialog />
  </div>
</template>
