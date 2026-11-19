<script setup lang="ts">
/**
 * The prototype's chrome, per navigation proposal (`?nav=`, see `./navVariants`):
 *
 * 1. **Production** — ☰ · wordmark · search, notifications, user menu.
 * 2. **Tab bar** — search moves to a bottom tab bar (Home · Saved · Search).
 * 3. **Home in menu** — Home heads the ☰ drawer.
 * 4. **Home in header** — a Home button before search in the bar.
 *
 * In every variant the user menu's first row (the account's name) leads to the
 * Home. Links that would leave the prototype are inert.
 */
import { computed, markRaw } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import { mergedLocationQuery } from '@/appearance/url-query'
import ChromeFooter from '@/components/chrome/ChromeFooter.vue'
import ChromeHeader from '@/components/chrome/ChromeHeader.vue'
import ChromeWrapper from '@/components/chrome/ChromeWrapper.vue'
import type { HeaderItem } from '@/components/header/headerItems'
import { provideChromeSearchHandlers } from '@/composables/useChromeSearch'
import { useConfig } from '@/composables/useConfig'

import NavMainMenu from './NavMainMenu.vue'
import NavTabBar from './NavTabBar.vue'
import NavUserMenu from './NavUserMenu.vue'
import {
  HOME_NAV_HOME_PATH,
  HOME_NAV_PATH,
  isHomeNavHref,
  keepNavParam,
  useNavVariant,
} from './navVariants'

const props = withDefaults(
  defineProps<{
    /** Footer "last edited" notice — on for articles, off for the Home. */
    lastEditedNotice?: boolean
  }>(),
  { lastEditedNotice: true },
)

const route = useRoute()
const router = useRouter()
const { variant } = useNavVariant()
const { displayName } = useConfig()

keepNavParam(router)

/** Search results open in the prototype, not the Article template. */
function openArticle(title: string | undefined): void {
  const trimmed = title?.trim()
  if (!trimmed) return
  void router.push({ path: HOME_NAV_PATH, query: mergedLocationQuery(route.query, { title: trimmed }) })
}

provideChromeSearchHandlers({
  onSelect: openArticle,
  onSubmit: ({ title }) => openArticle(title),
})

const LEFT: HeaderItem[] = [{ type: 'component', component: markRaw(NavMainMenu) }]

// A button, not a link item: Minerva header links are styled darker than its icon buttons.
const HOME: HeaderItem = {
  type: 'button',
  icon: 'home',
  label: 'Home',
  onClick: () => void router.push(HOME_NAV_HOME_PATH),
}
const SEARCH: HeaderItem = { type: 'button', icon: 'search', label: 'Search' }
const NOTIFICATIONS: HeaderItem = { type: 'button', icon: 'bell-outline', label: 'Notifications' }
const USER_MENU: HeaderItem = { type: 'component', component: markRaw(NavUserMenu) }

const right = computed((): HeaderItem[] => {
  switch (variant.value) {
    case 'tab-bar':
      return [NOTIFICATIONS, USER_MENU]
    case 'header':
      return [HOME, SEARCH, NOTIFICATIONS, USER_MENU]
    default:
      return [SEARCH, NOTIFICATIONS, USER_MENU]
  }
})

/**
 * Inert destinations: a link that would leave the prototype (another
 * prototype, Wikipedia, a reference's site) does nothing. In-page anchors
 * (`#…`) and the prototype's own pages go through.
 */
function leavingAnchor(event: MouseEvent): HTMLAnchorElement | null {
  const anchor = (event.target as Element | null)?.closest('a[href]')
  if (!(anchor instanceof HTMLAnchorElement)) return null
  if ((anchor.getAttribute('href') ?? '').startsWith('#') || isHomeNavHref(anchor.href)) return null
  return anchor
}

/** Another ProtoWiki page: stop it before its router link navigates. */
function onClickCapture(event: MouseEvent): void {
  const anchor = leavingAnchor(event)
  if (!anchor || anchor.origin !== window.location.origin) return
  event.preventDefault()
  event.stopPropagation()
}

/**
 * Off-site: let the page handle it first — search results are Wikipedia links
 * the overlay opens in the prototype — and only stop the browser leaving.
 */
function onClick(event: MouseEvent): void {
  if (event.defaultPrevented) return
  if (leavingAnchor(event)) event.preventDefault()
}
</script>

<template>
  <div class="nav-chrome" @click.capture="onClickCapture" @click="onClick">
    <ChromeWrapper :last-edited-notice="props.lastEditedNotice">
      <template #header>
        <ChromeHeader :left="LEFT" :right="right" />
      </template>

      <slot />

      <!-- PROTOWIKI+ (home-nav) ChromeWrapper has no slot after its footer, so the footer is rebuilt here. -->
      <template #footer>
        <ChromeFooter :last-edited-notice="props.lastEditedNotice" :username="displayName" />
        <NavTabBar v-if="variant === 'tab-bar'" />
      </template>
    </ChromeWrapper>
  </div>
</template>

<style scoped>
/* PROTOWIKI+ (home-nav) ChromeWrapper: footer follows short content; push it to the screen's bottom. */
.nav-chrome :deep(.chrome-footer) {
  margin-top: auto;
}
</style>
