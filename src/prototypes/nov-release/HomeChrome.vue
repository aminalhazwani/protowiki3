<script setup lang="ts">
/**
 * Wikipedia chrome for every Home page: the wordmark leads back to `/home`, the
 * header follows the prototype's account (see `useHomeSession`), search opens
 * articles inside the prototype, ☰ can reset the prototype, the user menu's own
 * row leads back to the Home, and any link off the prototype (header or content)
 * asks before leaving.
 */
import { useRoute, useRouter } from 'vue-router'

import { registerArticleOpener } from '@/components/article/shared/articleOpener'
import { registerAccountActions } from '@/components/chrome/accountActions'
import ChromeWrapper from '@/components/chrome/ChromeWrapper.vue'
import type { ChromeNavTool } from '@/components/chrome/headerNavTools'

import HomeLeavePrototypeDialog from './HomeLeavePrototypeDialog.vue'
import HomePrototypeMenu from './HomePrototypeMenu.vue'
import { CREATE_ACCOUNT_PATH, HOME_PATH, homeArticleLocation, titleFromRouteParam } from './routes'
import { useHomeSession } from './useHomeAccount'
import { useHomeLeavePrototype } from './useHomeLeavePrototype'

interface Props {
  /** Footer "last edited" notice — on for wiki pages, off for the Home dashboard. */
  lastEditedNotice?: boolean
  /** Module pages take over the screen: no footer, and their own bar for a header. */
  showFooter?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  lastEditedNotice: true,
  showFooter: true,
})

/**
 * Signed-in Vector tools: the account's name is a link back to the Home, before
 * the icons, and the user menu hangs off an avatar.
 */
const NAV_TOOLS: ChromeNavTool[] = [
  'appearance',
  'notifications',
  'notices',
  'bookmarks',
  'watchlist',
  'user-avatar-menu',
]

const { logOut, goHomeAs } = useHomeSession()

const { onLeaveCapture } = useHomeLeavePrototype()

const router = useRouter()
const route = useRoute()
registerArticleOpener({
  href: (title) => router.resolve(homeArticleLocation(title)).href,
  open: (title) => void router.push(homeArticleLocation(title)),
})

/** From an article, `?from=<Title>`: onboarding's interests start from it (home2). */
function createAccountLocation() {
  const title = (route.params as { title?: string | string[] }).title
  const from = title ? titleFromRouteParam(title) : ''
  return { path: CREATE_ACCOUNT_PATH, query: from ? { from } : {} }
}

registerAccountActions({
  // The account's name is the way back Home: Minerva's menu row, and Vector's link.
  userPage: () => void router.push(HOME_PATH),
  // Logging out lands on the logged-out Main Page.
  logOut: () => goHomeAs(logOut),
  // The prototype's own Special:CreateAccount, told which article it was opened from.
  createAccount: {
    href: () => router.resolve(createAccountLocation()).href,
    open: () => void router.push(createAccountLocation()),
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
      <!-- ☰ holds "Prototype settings" and, as its footer, "Reset prototype". -->
      <template #menu>
        <HomePrototypeMenu />
      </template>
      <slot />
    </ChromeWrapper>
    <HomeLeavePrototypeDialog />
  </div>
</template>

