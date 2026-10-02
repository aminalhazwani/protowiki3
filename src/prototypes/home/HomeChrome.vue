<script setup lang="ts">
/**
 * Wikipedia chrome for every Home page: the wordmark leads back to `/home`, the
 * header follows the prototype's account (see `useHomeSession`), search opens
 * articles inside the prototype, ☰ can reset the prototype, and any link off
 * the prototype (header or content) asks before leaving.
 */
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { CdxIcon } from '@wikimedia/codex'
import { cdxIconHome } from '@wikimedia/codex-icons'

import { registerArticleOpener } from '@/components/article/shared/articleOpener'
import { registerAccountActions } from '@/components/chrome/accountActions'
import ChromeWrapper from '@/components/chrome/ChromeWrapper.vue'
import type { ChromeNavTool } from '@/components/chrome/headerNavTools'
import { globalSkin } from '@/theme'

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
  /** Minerva, signed in: a Home button floats in the corner (Vector has one in its tools). */
  floatingHome?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  lastEditedNotice: true,
  showFooter: true,
  floatingHome: false,
})

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

const { isLoggedIn, logOut, goHomeAs } = useHomeSession()

const showFloatingHome = computed(
  () => props.floatingHome && isLoggedIn.value && globalSkin.value === 'mobile',
)
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
  // Logging out lands on the logged-out Main Page.
  logOut: () => void goHomeAs(logOut),
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
      <!-- ☰ holds "Reset prototype", for starting a test session over. -->
      <template #menu>
        <HomePrototypeMenu />
      </template>
      <slot />
      <!-- Framed, thumb-sized and icon-only: a labelled pill would cover more of the article. -->
      <RouterLink
        v-if="showFloatingHome"
        class="home-chrome__home cdx-button cdx-button--fake-button cdx-button--fake-button--enabled cdx-button--size-large cdx-button--icon-only"
        :to="HOME_PATH"
        aria-label="Home"
      >
        <CdxIcon :icon="cdxIconHome" />
      </RouterLink>
    </ChromeWrapper>
    <HomeLeavePrototypeDialog />
  </div>
</template>

<style scoped>
/* Pinned to the viewport's end corner (left in RTL), clear of the home indicator. */
.home-chrome__home {
  position: fixed;
  bottom: calc(var(--spacing-75, 12px) + env(safe-area-inset-bottom, 0px));
  inset-inline-end: var(--spacing-75, 12px);
  z-index: var(--z-index-fixed, 200);
}
</style>
