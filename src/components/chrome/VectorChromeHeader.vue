<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue'
import { RouterLink, type RouteLocationRaw } from 'vue-router'
import { CdxButton, CdxIcon, CdxMenuButton } from '@wikimedia/codex'
import type { MenuButtonItemData, MenuItemValue } from '@wikimedia/codex'
import {
  cdxIconAppearance,
  cdxIconBell,
  cdxIconBookmarkList,
  cdxIconExpand,
  cdxIconHome,
  cdxIconImageGallery,
  cdxIconLabFlask,
  cdxIconLanguage,
  cdxIconLogOut,
  cdxIconMenu,
  cdxIconSandbox,
  cdxIconSearch,
  cdxIconSettings,
  cdxIconTray,
  cdxIconUserAvatar,
  cdxIconUserContributions,
  cdxIconUserTalk,
  cdxIconWatchlist,
} from '@wikimedia/codex-icons'

import { useConfig } from '@/composables/useConfig'
import { accountActions } from './accountActions'
import { DEFAULT_CHROME_NAV_TOOLS, type ChromeNavTool } from './headerNavTools'
import { globalTheme } from '@/theme'
import type { Theme } from '@/theme'
import Search from '../Search.vue'

const { user, displayName } = useConfig()

/** Fallback EN CDN SVGs — override via **`wordmarkSrc`** / **`taglineSrc`**. */
const WIKIPEDIA_WORDMARK_EN =
  'https://en.wikipedia.org/static/images/mobile/copyright/wikipedia-wordmark-en-25.svg'
const WIKIPEDIA_TAGLINE_EN =
  'https://en.wikipedia.org/static/images/mobile/copyright/wikipedia-tagline-en-25.svg'

interface Props {
  /** Local theme override. Sets `data-theme` on the root. */
  theme?: Theme
  /**
   * Meta link mock before tool icons; trim; empty hides unless **`#username`** overrides.
   * With **`user-menu`** in **`navTools`** the name labels that button instead
   * (the mock user's display name stands in when empty).
   */
  username?: string
  /** Stacked wordmark image URL (`#logo` replaces both lines). */
  wordmarkSrc?: string
  /** Tagline image URL beneath the wordmark. */
  taglineSrc?: string
  /**
   * Subset/order of mocked Vector tool icons.
   * **`#nav`** replaces the whole cluster regardless.
   */
  navTools?: ChromeNavTool[]
  /** PROTOWIKI+ (Home) Where the Wikipedia wordmark links to (default **`'/'`**, the gallery). */
  brandTo?: RouteLocationRaw
}

const props = withDefaults(defineProps<Props>(), {
  theme: undefined,
  username: undefined,
  wordmarkSrc: undefined,
  taglineSrc: undefined,
  navTools: undefined,
  brandTo: '/',
})

const effectiveTheme = computed<Theme>(() => props.theme ?? globalTheme.value)

/*
 * PROTOWIKI+ (Home) Below 1120px the search box folds into an icon. Like Vector
 * 2022, the icon now opens the box in place of the header's tools (instead of
 * linking to the real Special:Search), and it folds again on Escape or when
 * focus leaves it.
 */
const searchOpen = ref(false)
const inlineSearch = ref<HTMLElement | null>(null)

async function openSearch(): Promise<void> {
  searchOpen.value = true
  await nextTick()
  inlineSearch.value?.querySelector('input')?.focus()
}

function onSearchFocusOut(event: FocusEvent): void {
  if (!inlineSearch.value?.contains(event.relatedTarget as Node | null)) searchOpen.value = false
}
const trimmedUsername = computed(() => (props.username ?? '').trim())
const isLoggedOut = computed(() => user.value === 'logged-out')

const desktopWordmarkSrc = computed(() => props.wordmarkSrc ?? WIKIPEDIA_WORDMARK_EN)
const desktopTaglineSrc = computed(() => props.taglineSrc ?? WIKIPEDIA_TAGLINE_EN)

const effectiveNavTools = computed(() =>
  props.navTools?.length ? props.navTools : DEFAULT_CHROME_NAV_TOOLS,
)

function navHas(tool: ChromeNavTool): boolean {
  return effectiveNavTools.value.includes(tool)
}

/* PROTOWIKI+ (Home) The `user-menu` tool carries the name, so the meta link would repeat it. */
const showChromeUsernameLink = computed(
  () => trimmedUsername.value.length > 0 && !navHas('user-menu'),
)
const userMenuLabel = computed(() => trimmedUsername.value || displayName.value)

/**
 * PROTOWIKI+ (Home) Mocked Vector user menu. The name is on the button, so the
 * first row names the destination. Rows are inert like the rest of the chrome
 * (except "Log out" when the page registered `accountActions`): a pick closes
 * the menu and the selection is cleared, so no row stays checked.
 */
const USER_MENU_ITEMS: MenuButtonItemData[] = [
  { value: 'user-page', label: 'User page', icon: cdxIconUserAvatar },
  { value: 'talk', label: 'Talk', icon: cdxIconUserTalk },
  { value: 'sandbox', label: 'Sandbox', icon: cdxIconSandbox },
  { value: 'preferences', label: 'Preferences', icon: cdxIconSettings },
  { value: 'beta', label: 'Beta', icon: cdxIconLabFlask },
  { value: 'contributions', label: 'Contributions', icon: cdxIconUserContributions },
  { value: 'translations', label: 'Translations', icon: cdxIconLanguage },
  { value: 'uploaded-media', label: 'Uploaded media', icon: cdxIconImageGallery },
  { value: 'log-out', label: 'Log out', icon: cdxIconLogOut },
]

const userMenuSelection = ref<MenuItemValue | null>(null)
watch(userMenuSelection, (value) => {
  if (value === null) return
  userMenuSelection.value = null
  if (value === 'log-out') accountActions.value?.logOut?.()
})
</script>

<template>
  <header
    class="vector-chrome-header"
    :class="{ 'vector-chrome-header--search-open': searchOpen }"
    data-skin="desktop"
    :data-theme="effectiveTheme"
  >
    <nav class="vector-chrome-header__nav" aria-label="Site">
      <div class="vector-chrome-header__start">
        <slot name="menu">
          <!-- Mock only — not interactive (FakeMediaWiki uses bare chrome / icon affordances). -->
          <span class="vector-chrome-header__menu-icon" aria-hidden="true">
            <CdxIcon :icon="cdxIconMenu" />
          </span>
        </slot>

        <RouterLink
          class="vector-chrome-header__brand-link"
          :to="props.brandTo"
          aria-label="Visit the main page"
        >
          <slot name="logo">
            <span class="vector-chrome-header__wordmarks">
              <img
                class="vector-chrome-header__wordmark-img"
                :src="desktopWordmarkSrc"
                width="120"
                height="18"
                alt="Wikipedia"
              />
              <img
                class="vector-chrome-header__tagline-img"
                :src="desktopTaglineSrc"
                width="120"
                height="14"
                alt=""
              />
            </span>
          </slot>
        </RouterLink>
      </div>

      <div
        ref="inlineSearch"
        class="vector-chrome-header__inline-search"
        @focusout="onSearchFocusOut"
        @keydown.esc="searchOpen = false"
      >
        <div class="vector-chrome-header__search">
          <Search />
        </div>
        <!--
          PROTOWIKI+ (Home) Submits the search form (its id is Search's `protowiki-search`)
          rather than linking to an empty Special:Search: the query goes with it, and a
          page with an article opener opens the best match in place.
        -->
        <CdxButton
          class="vector-chrome-header__search-submit"
          type="submit"
          form="protowiki-search"
        >
          Search
        </CdxButton>
      </div>

      <div class="vector-chrome-header__end">
        <CdxButton
          class="vector-chrome-header__search-icon-toggle"
          weight="quiet"
          aria-label="Search"
          :aria-expanded="searchOpen"
          @click="openSearch"
        >
          <CdxIcon :icon="cdxIconSearch" />
        </CdxButton>
        <slot name="username">
          <div v-if="isLoggedOut" class="vector-chrome-header__logged-out-toolbar">
            <a
              class="vector-chrome-header__text-link"
              href="https://donate.wikimedia.org/"
              rel="noopener noreferrer"
            >
              Donate
            </a>
            <a
              class="vector-chrome-header__text-link"
              href="https://en.wikipedia.org/w/index.php?title=Special:CreateAccount"
              rel="noopener noreferrer"
            >
              Create account
            </a>
            <a
              class="vector-chrome-header__text-link"
              href="https://en.wikipedia.org/w/index.php?title=Special:UserLogin"
              rel="noopener noreferrer"
            >
              Log in
            </a>
          </div>
          <a
            v-else-if="showChromeUsernameLink"
            class="vector-chrome-header__text-link vector-chrome-header__username-display"
            href="#"
            @click.prevent
          >
            {{ trimmedUsername }}
          </a>
        </slot>
        <slot v-if="!isLoggedOut" name="nav">
          <!-- PROTOWIKI+ (Home) Opt-in Home tool: a link to where the wordmark goes. -->
          <RouterLink
            v-if="navHas('home')"
            class="vector-chrome-header__home cdx-button cdx-button--fake-button cdx-button--fake-button--enabled cdx-button--weight-quiet cdx-button--action-progressive"
            :to="props.brandTo"
          >
            <CdxIcon :icon="cdxIconHome" />
            Home
          </RouterLink>
          <CdxButton v-if="navHas('appearance')" weight="quiet" aria-label="Appearance">
            <CdxIcon :icon="cdxIconAppearance" />
          </CdxButton>
          <CdxButton
            v-if="navHas('notifications')"
            weight="quiet"
            aria-label="Notifications"
          >
            <CdxIcon :icon="cdxIconBell" />
          </CdxButton>
          <CdxButton v-if="navHas('notices')" weight="quiet" aria-label="Notices">
            <CdxIcon :icon="cdxIconTray" />
          </CdxButton>
          <CdxButton v-if="navHas('bookmarks')" weight="quiet" aria-label="Reading lists">
            <CdxIcon :icon="cdxIconBookmarkList" />
          </CdxButton>
          <CdxButton
            v-if="navHas('watchlist')"
            weight="quiet"
            class="vector-chrome-header__hide-narrow"
            aria-label="Watchlist"
          >
            <CdxIcon :icon="cdxIconWatchlist" />
          </CdxButton>
          <CdxButton v-if="navHas('user')" weight="quiet" aria-label="User menu">
            <CdxIcon :icon="cdxIconUserAvatar" />
          </CdxButton>
          <!-- The visible name is the accessible name, so no `aria-label`. -->
          <CdxMenuButton
            v-if="navHas('user-menu')"
            v-model:selected="userMenuSelection"
            class="vector-chrome-header__user-menu"
            weight="quiet"
            :menu-items="USER_MENU_ITEMS"
          >
            {{ userMenuLabel }}
            <CdxIcon :icon="cdxIconExpand" size="small" />
          </CdxMenuButton>
        </slot>
      </div>
    </nav>
  </header>
</template>

<style scoped>
.vector-chrome-header {
  background-color: var(--background-color-base, #fff);
}

.vector-chrome-header__search {
  min-width: 0;
}

.vector-chrome-header__wordmark-img,
.vector-chrome-header__tagline-img {
  display: block;
  width: auto;
  max-width: 100%;
}

/*
 * Breakpoint parity with FakeMediaWiki `src/views/SpecialView/style.css`:
 * - max-width 1120px — collapse inline search → icon (nav-item-search / nav-button-search).
 * - max-width 768px — hide desktop-only tools (nav-button-desktop, e.g. watchlist).
 * Skin swap (nav-desktop vs nav-mobile) stays at 640px via src/theme.ts.
 */

.vector-chrome-header__nav {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--spacing-100, 16px);
  min-height: 66px;
  padding: var(--spacing-50, 8px) var(--spacing-100, 16px);
}

.vector-chrome-header__start {
  display: flex;
  align-items: center;
  gap: var(--spacing-50, 8px);
}

.vector-chrome-header__menu-icon {
  display: inline-flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  min-width: var(--size-icon-medium, 32px);
  min-height: var(--size-icon-medium, 32px);
  margin: 0;
  padding: var(--spacing-25, 4px);
  padding-inline-start: var(--spacing-50, 8px);
  border: none;
  background: transparent;
  color: var(--color-base, #202122);
  line-height: 0;
  cursor: default;
  pointer-events: none;
}

.vector-chrome-header :slotted(.chrome-header__menu-btn) {
  flex-shrink: 0;
  min-width: var(--size-icon-medium, 32px);
  height: var(--size-icon-medium, 32px);
  margin: 0;
  padding: var(--spacing-25, 4px);
  padding-inline-start: var(--spacing-50, 8px);
}

.vector-chrome-header__menu-icon :deep(svg) {
  display: block;
}

.vector-chrome-header__brand-link {
  display: flex;
  align-items: center;
  text-decoration: none;
  color: inherit;
}

.vector-chrome-header__brand-link:hover {
  text-decoration: none;
  color: inherit;
}

.vector-chrome-header__wordmarks {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  gap: 2px;
  padding-block: 3px;
  padding-inline-start: var(--spacing-75, 12px);
  margin-inline-start: var(--spacing-50, 8px);
  width: 152px;
  min-height: 44px;
}

.vector-chrome-header__inline-search {
  display: flex;
  flex: 1 1 auto;
  align-items: stretch;
  gap: 0;
  max-width: 474px;
  padding-inline-start: var(--spacing-150, 24px);
}

.vector-chrome-header__inline-search .vector-chrome-header__search {
  flex: 1;
  min-width: 0;
  max-width: 32rem;
}

.vector-chrome-header__search-submit.cdx-button {
  align-self: stretch;
  border-radius: 0 var(--border-radius-base, 2px) var(--border-radius-base, 2px) 0;
  margin-inline-start: -1px;
}

.vector-chrome-header__search-icon-toggle {
  display: none;
}

.vector-chrome-header__end {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.2rem;
  margin-inline-start: auto;
}

.vector-chrome-header__logged-out-toolbar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--spacing-75, 12px);
  margin-inline: var(--spacing-8, 8px);
}

.vector-chrome-header__text-link {
  color: var(--color-progressive, #36c);
  font-size: var(--font-size-medium, 1rem);
  font-weight: normal;
  line-height: 1.4;
  text-decoration: none;
}

a.vector-chrome-header__text-link:hover {
  text-decoration: underline;
}

.vector-chrome-header__username-display {
  margin-inline: var(--spacing-8, 8px);
}

.vector-chrome-header__end .cdx-button {
  min-width: var(--size-icon-medium, 32px);
  height: var(--size-icon-medium, 32px);
  padding: 0.5rem 0.4rem;
}

/*
 * PROTOWIKI+ (Home) Home and the user menu carry labels: they size to their
 * content and never shrink (the narrow rule below squares the other tools off
 * at 40px, which would clip a label). Three classes outrank it.
 */
.vector-chrome-header__end .vector-chrome-header__home.cdx-button,
.vector-chrome-header__end .vector-chrome-header__user-menu :deep(.cdx-button) {
  width: auto;
  flex-shrink: 0;
  gap: var(--spacing-25, 4px);
  padding-inline: var(--spacing-50, 8px);
  white-space: nowrap;
}

.vector-chrome-header__home {
  text-decoration: none;
}

/*
 * CODEX+ CdxMenuButton: no option to size the menu to its rows. Floating UI
 * writes the trigger's width inline, so a short name would clip "Uploaded
 * media"; only `!important` beats an inline style. Floating UI still flips the
 * wider menu to grow leftwards at the screen edge.
 */
.vector-chrome-header__user-menu :deep(.cdx-menu) {
  width: max-content !important;
  max-width: 22rem;
}

/* Vector's user menu: base-coloured icons, progressive (link) labels. */
.vector-chrome-header__user-menu :deep(.cdx-menu-item__icon) {
  color: var(--color-base, #202122);
}

.vector-chrome-header__user-menu :deep(.cdx-menu-item__text__label) {
  color: var(--color-progressive, #36c);
}

.vector-chrome-header[data-theme='dark'] .vector-chrome-header__wordmark-img,
.vector-chrome-header[data-theme='dark'] .vector-chrome-header__tagline-img {
  opacity: 0;
}

@media (max-width: 1120px) {
  .vector-chrome-header__inline-search {
    display: none;
  }

  /* Opened from the icon: the search box takes the place of the header's tools. */
  .vector-chrome-header--search-open .vector-chrome-header__inline-search {
    display: flex;
  }

  .vector-chrome-header--search-open .vector-chrome-header__end {
    display: none;
  }

  .vector-chrome-header__search-icon-toggle {
    display: inline-flex;
  }

  .vector-chrome-header__end .cdx-button {
    height: var(--size-icon-large, 40px);
    width: var(--size-icon-large, 40px);
    padding: 0.7rem;
  }
}

@media (max-width: 768px) {
  .vector-chrome-header__hide-narrow {
    display: none !important;
  }
}
</style>
