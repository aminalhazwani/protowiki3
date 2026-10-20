<script setup lang="ts">
/**
 * Wikipedia chrome for every Home page: the wordmark leads to the Main Page, the
 * header follows the prototype's account (see `useHomeSession`), search opens
 * articles inside the prototype, ☰ can reset the prototype, the user menu's own
 * row leads back to the Home, and any link off the prototype (header or content)
 * asks before leaving.
 */
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import { registerArticleOpener } from '@/components/article/shared/articleOpener'
import { registerAccountActions } from '@/components/chrome/accountActions'
import ChromeFooter from '@/components/chrome/ChromeFooter.vue'
import ChromeWrapper from '@/components/chrome/ChromeWrapper.vue'
import type { ChromeNavTool } from '@/components/chrome/headerNavTools'
import { useConfig } from '@/composables/useConfig'
import { globalSkin } from '@/theme'

import HomeLeavePrototypeDialog from './HomeLeavePrototypeDialog.vue'
import HomeMobileTabBar from './HomeMobileTabBar.vue'
import HomeMainMenu from './HomeMainMenu.vue'
import {
  CREATE_ACCOUNT_PATH,
  HOME_PATH,
  homeArticleLocation,
  MAIN_PAGE_PATH,
  titleFromRouteParam,
} from './routes'
import { useHomeSession } from './useHomeAccount'
import { useHomeLeavePrototype } from './useHomeLeavePrototype'
import { installHomeScroll } from './useHomeScroll'

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

const { isLoggedIn, logOut, goHomeAs } = useHomeSession()
const { displayName } = useConfig()

/* Logged out, the prototype root is the Main Page; signed in it's the Home, so the Main Page is a wiki page. */
const brandTo = computed(() => (isLoggedIn.value ? MAIN_PAGE_PATH : HOME_PATH))

/** Signed in on mobile: the tab bar sits under every page. */
const showTabBar = computed(() => isLoggedIn.value && globalSkin.value === 'mobile')
/** With a footer, the footer's own grey makes room for the bar (no white band under it). */
const footerHoldsTabBar = computed(() => showTabBar.value && props.showFooter)

const { onLeaveCapture } = useHomeLeavePrototype()

const router = useRouter()
const route = useRoute()
// Each page keeps its own scroll position (see `useHomeScroll`).
installHomeScroll(router)
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
  <div
    class="home-chrome"
    :class="{ 'home-chrome--footer-holds-tab-bar': footerHoldsTabBar }"
    @click.capture="onLeaveCapture"
  >
    <ChromeWrapper
      :brand-to="brandTo"
      :nav-tools="NAV_TOOLS"
      :last-edited-notice="props.lastEditedNotice"
      :show-footer="props.showFooter"
    >
      <!-- A page's own header (a module page's back bar) replaces the wiki header. -->
      <template v-if="$slots.header" #header>
        <slot name="header" />
      </template>
      <!-- ☰: Minerva's main menu drawer (Prototype settings and Reset at its foot); Vector's small menu. -->
      <template #menu>
        <HomeMainMenu />
      </template>
      <slot />
      <!-- PROTOWIKI+ (mobile-nav) ChromeWrapper has no slot after its footer, so the footer is rebuilt here. -->
      <template #footer>
        <ChromeFooter
          v-if="props.showFooter"
          :last-edited-notice="props.lastEditedNotice"
          :username="displayName"
        />
        <HomeMobileTabBar v-if="showTabBar" :reserve-space="!footerHoldsTabBar" />
      </template>
    </ChromeWrapper>
    <HomeLeavePrototypeDialog />
  </div>
</template>

<style scoped>
/* PROTOWIKI+ (mobile-nav) ChromeWrapper: footer follows short content; push it to the screen's bottom. */
.home-chrome :deep(.chrome-footer) {
  margin-top: auto;
}

/*
 * PROTOWIKI+ (mobile-nav) ChromeFooter: the room under the tab bar (56px, its
 * height) is the footer's grey, so the page never ends on a white band. On top,
 * the footer's own edge padding, which it leaves off at the bottom.
 */
.home-chrome--footer-holds-tab-bar :deep(.chrome-footer__mobile-body) {
  padding-bottom: calc(var(--spacing-100, 16px) + 56px);
}
</style>
