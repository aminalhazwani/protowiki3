<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { RouterLink } from 'vue-router'
import {
  CdxButton,
  CdxField,
  CdxIcon,
  CdxMenuButton,
  CdxPopover,
  CdxRadio,
  CdxToggleSwitch,
} from '@wikimedia/codex'
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
import { useScrolledPast } from '@/composables/useScrolledPast'
import { DEFAULT_CHROME_NAV_TOOLS, type ChromeNavTool } from './headerNavTools'
import { stickyHeaderSentinel } from './stickyHeaderSubject'
import VectorStickyHeader from './VectorStickyHeader.vue'
import { HOME_ACTIONS, HOME_WEIGHTS, useHomeButtonPlayground } from './homeButtonPlayground'
import {
  USERNAME_PLACEMENT_LABELS,
  USERNAME_PLACEMENTS,
  useDesktopNavPlayground,
} from './desktopNavPlayground'
import { useStickyHeaderPlayground } from './stickyHeaderPlayground'
import { globalTheme } from '@/theme'
import type { Theme } from '@/theme'
import { homeButtonLabel, uiLanguageTag } from '@/uiLanguage'
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
   * Name behind the username affordances; trimmed, and the mock user's display
   * name stands in when empty. *Where* it shows — meta link before the tool
   * icons, label on the closing user button, or user menu only — is the
   * playground's **Username** setting, which starts from this prop: a name here
   * means the meta link, **`''`** means the user menu only. **`#username`**
   * replaces the meta-link slot regardless.
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
}

const props = withDefaults(defineProps<Props>(), {
  theme: undefined,
  username: undefined,
  wordmarkSrc: undefined,
  taglineSrc: undefined,
  navTools: undefined,
})

const effectiveTheme = computed<Theme>(() => props.theme ?? globalTheme.value)
const trimmedUsername = computed(() => (props.username ?? '').trim())
const isLoggedOut = computed(() => user.value === 'logged-out')

/**
 * Where the username surfaces, and whether the two Echo inboxes share a
 * button. The starting placement follows the `username` prop: a surface that
 * passes a name wants Vector's own meta link, one that passes `''` — Home
 * leads the cluster in its place — starts with the name in the user menu only.
 * Either way the playground can move it, and the param is written only when it
 * differs from that starting point.
 */
const { usernamePlacement, mergeNotices } = useDesktopNavPlayground({
  placement: trimmedUsername.value.length > 0 ? 'toolbar' : 'menu',
  mergeNotices: false,
})

/** The prop names the account; the mock user's display name stands in when it doesn't. */
const usernameText = computed(() => trimmedUsername.value || displayName.value)
const showToolbarUsername = computed(
  () => !isLoggedOut.value && usernamePlacement.value === 'toolbar',
)
/** Username as the label of the cluster's closing user button. */
const showUsernameOnButton = computed(() => usernamePlacement.value === 'button')

const desktopWordmarkSrc = computed(() => props.wordmarkSrc ?? WIKIPEDIA_WORDMARK_EN)
const desktopTaglineSrc = computed(() => props.taglineSrc ?? WIKIPEDIA_TAGLINE_EN)

const effectiveNavTools = computed(() =>
  props.navTools?.length ? props.navTools : DEFAULT_CHROME_NAV_TOOLS,
)

function navHas(tool: ChromeNavTool): boolean {
  return effectiveNavTools.value.includes(tool)
}

/**
 * Echo ships two inboxes — alerts (bell) and notices (tray). Merged, the bell
 * stands in for both: notices drops out of the cluster and the bell's label
 * names the pair, so nothing is silently lost to a screen reader.
 */
const showAlerts = computed(
  () => navHas('notifications') || (mergeNotices.value && navHas('notices')),
)
const showNotices = computed(() => navHas('notices') && !mergeNotices.value)
const alertsLabel = computed(() =>
  mergeNotices.value && navHas('notices') ? 'Alerts and notices' : 'Notifications',
)

/**
 * Mocked Vector user menu. Items are inert affordances like the rest of the
 * chrome — selecting one closes the menu and clears the selection so no entry
 * renders a persistent checkmark.
 */
const userMenuItems = computed((): MenuButtonItemData[] => [
  { value: 'user-page', label: displayName.value, icon: cdxIconUserAvatar },
  { value: 'talk', label: 'Talk', icon: cdxIconUserTalk },
  { value: 'sandbox', label: 'Sandbox', icon: cdxIconSandbox },
  { value: 'preferences', label: 'Preferences', icon: cdxIconSettings },
  { value: 'beta', label: 'Beta', icon: cdxIconLabFlask },
  { value: 'contributions', label: 'Contributions', icon: cdxIconUserContributions },
  { value: 'translations', label: 'Translations', icon: cdxIconLanguage },
  { value: 'uploaded-media', label: 'Uploaded media', icon: cdxIconImageGallery },
  { value: 'log-out', label: 'Log out', icon: cdxIconLogOut },
])

/** Main-menu popover — Home button playground, anchored to the hamburger button. */
const mainMenuOpen = ref(false)
const mainMenuAnchor = ref<HTMLElement | null>(null)

/**
 * Vector renders Home inline in the end cluster, so it starts framed-free and
 * labelled; `size` is fixed by the cluster's own 32px sizing and `round` only
 * means something for Minerva's floating button, so neither gets a control.
 */
const {
  action: homeAction,
  weight: homeWeight,
  iconOnly: homeIconOnly,
} = useHomeButtonPlayground({
  action: 'progressive',
  weight: 'quiet',
  size: 'medium',
  iconOnly: false,
  round: false,
})

/**
 * Sticky header trigger. An article registers its heading as the sentinel, so
 * the bar slides in exactly when the title leaves — Vector's own behaviour. On
 * a page with no article the site nav stands in, and the bar appears once the
 * chrome itself has scrolled away.
 */
const { showHome: stickyShowHome, languagesCountOnly: stickyLanguagesCountOnly } =
  useStickyHeaderPlayground()

const navEl = ref<HTMLElement | null>(null)
const stickyTrigger = computed(() => stickyHeaderSentinel.value ?? navEl.value)
const stickyActive = useScrolledPast(stickyTrigger)

const userMenuSelection = ref<MenuItemValue | null>(null)

watch(userMenuSelection, (value) => {
  if (value !== null) userMenuSelection.value = null
})
</script>

<template>
  <header class="vector-chrome-header" data-skin="desktop" :data-theme="effectiveTheme">
    <nav ref="navEl" class="vector-chrome-header__nav" aria-label="Site">
      <div class="vector-chrome-header__start">
        <slot name="menu">
          <span ref="mainMenuAnchor" class="vector-chrome-header__menu-anchor">
            <CdxButton
              class="vector-chrome-header__menu-btn"
              weight="quiet"
              aria-label="Main menu"
              :aria-expanded="mainMenuOpen"
              aria-haspopup="dialog"
              @click="mainMenuOpen = !mainMenuOpen"
            >
              <CdxIcon :icon="cdxIconMenu" />
            </CdxButton>
          </span>
        </slot>

        <RouterLink
          class="vector-chrome-header__brand-link"
          to="/"
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

      <div class="vector-chrome-header__inline-search">
        <div class="vector-chrome-header__search">
          <Search />
        </div>
        <CdxButton
          class="vector-chrome-header__search-submit"
          tag="a"
          href="https://en.wikipedia.org/wiki/Special:Search"
        >
          Search
        </CdxButton>
      </div>

      <div class="vector-chrome-header__end">
        <CdxButton
          class="vector-chrome-header__search-icon-toggle"
          weight="quiet"
          aria-label="Search"
          tag="a"
          href="https://en.wikipedia.org/wiki/Special:Search"
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
            v-else-if="showToolbarUsername"
            class="vector-chrome-header__text-link vector-chrome-header__username-display"
            href="#"
            @click.prevent
          >
            {{ usernameText }}
          </a>
        </slot>
        <slot v-if="!isLoggedOut" name="nav">
          <CdxButton
            v-if="navHas('home')"
            class="vector-chrome-header__home"
            :class="{ 'vector-chrome-header__home--icon-only': homeIconOnly }"
            :weight="homeWeight"
            :action="homeAction"
            :aria-label="homeIconOnly ? homeButtonLabel : undefined"
          >
            <CdxIcon :icon="cdxIconHome" />
            <!-- `mobile-frontend-home-button`, in whichever language the
                 interlanguage menu last selected. `dir="auto"` keeps RTL
                 translations (fa, he) from mirroring the whole button. -->
            <span v-if="!homeIconOnly" :lang="uiLanguageTag" dir="auto">{{ homeButtonLabel }}</span>
          </CdxButton>
          <CdxButton v-if="navHas('appearance')" weight="quiet" aria-label="Appearance">
            <CdxIcon :icon="cdxIconAppearance" />
          </CdxButton>
          <!-- Merged, the bell speaks for both inboxes and the tray drops out. -->
          <CdxButton v-if="showAlerts" weight="quiet" :aria-label="alertsLabel">
            <CdxIcon :icon="cdxIconBell" />
          </CdxButton>
          <CdxButton v-if="showNotices" weight="quiet" aria-label="Notices">
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
          <!--
            With the name on the button the visible label *is* the accessible
            name, so the `aria-label` steps aside rather than talking over it.
          -->
          <CdxButton
            v-if="navHas('user')"
            class="vector-chrome-header__labelled-user"
            :class="{ 'vector-chrome-header__labelled-user--on': showUsernameOnButton }"
            weight="quiet"
            :aria-label="showUsernameOnButton ? undefined : 'User menu'"
          >
            <CdxIcon :icon="cdxIconUserAvatar" />
            <span v-if="showUsernameOnButton">{{ usernameText }}</span>
          </CdxButton>
          <CdxMenuButton
            v-if="navHas('user-menu')"
            v-model:selected="userMenuSelection"
            class="vector-chrome-header__user-menu vector-chrome-header__labelled-user menu-content-width"
            :class="{ 'vector-chrome-header__labelled-user--on': showUsernameOnButton }"
            weight="quiet"
            :aria-label="showUsernameOnButton ? undefined : 'User menu'"
            :menu-items="userMenuItems"
          >
            <CdxIcon :icon="cdxIconUserAvatar" />
            <span v-if="showUsernameOnButton">{{ usernameText }}</span>
            <CdxIcon
              class="vector-chrome-header__user-menu-chevron"
              :icon="cdxIconExpand"
              size="small"
            />
          </CdxMenuButton>
        </slot>
      </div>
    </nav>

    <!--
      Anchored to the hamburger but deliberately outside `__nav` / `__start`:
      with `render-in-place` the popover's backdrop is a static-flow element, so
      inside either flex row it becomes a flex item and shifts the wordmark.
    -->
    <CdxPopover
      v-model:open="mainMenuOpen"
      :anchor="mainMenuAnchor"
      placement="bottom-start"
      render-in-place
    >
      <div class="vector-chrome-header__menu-panel">
        <section class="vector-chrome-header__menu-section">
          <h2 class="vector-chrome-header__menu-section-title">Home button</h2>

          <CdxField :is-fieldset="true">
            <template #label>Action</template>
            <CdxRadio
              v-for="value in HOME_ACTIONS"
              :key="value"
              v-model="homeAction"
              :input-value="value"
              name="home-action"
              inline
            >
              {{ value }}
            </CdxRadio>
          </CdxField>

          <CdxField :is-fieldset="true">
            <template #label>Weight</template>
            <CdxRadio
              v-for="value in HOME_WEIGHTS"
              :key="value"
              v-model="homeWeight"
              :input-value="value"
              name="home-weight"
              inline
            >
              {{ value }}
            </CdxRadio>
          </CdxField>

          <CdxToggleSwitch v-model="homeIconOnly">Icon only</CdxToggleSwitch>
        </section>

        <!--
          One name, one place: radios rather than a switch per position, so the
          panel can't offer a state the toolbar has no way to render.
        -->
        <section class="vector-chrome-header__menu-section">
          <h2 class="vector-chrome-header__menu-section-title">Username</h2>

          <CdxField :is-fieldset="true">
            <template #label>Placement</template>
            <CdxRadio
              v-for="value in USERNAME_PLACEMENTS"
              :key="value"
              v-model="usernamePlacement"
              :input-value="value"
              name="username-placement"
            >
              {{ USERNAME_PLACEMENT_LABELS[value] }}
            </CdxRadio>
          </CdxField>
        </section>

        <section class="vector-chrome-header__menu-section">
          <h2 class="vector-chrome-header__menu-section-title">Alerts and notices</h2>

          <!-- Which icon survives is in the section title: the alerts bell. -->
          <CdxToggleSwitch v-model="mergeNotices">Merge into one button</CdxToggleSwitch>
        </section>

        <section class="vector-chrome-header__menu-section">
          <h2 class="vector-chrome-header__menu-section-title">Sticky header</h2>

          <CdxToggleSwitch v-model="stickyShowHome">Home button</CdxToggleSwitch>
          <CdxToggleSwitch v-model="stickyLanguagesCountOnly">Languages count only</CdxToggleSwitch>
        </section>
      </div>
    </CdxPopover>

    <!--
      Condensed bar that overlays the article once the page has scrolled. Last
      in the header so it stacks over the nav without needing a higher
      `z-index`, and outside `__nav` because it's pinned to the viewport rather
      than laid out in the bar.
    -->
    <VectorStickyHeader
      :active="stickyActive"
      :theme="effectiveTheme"
      :show-home="stickyShowHome"
      :home-action="homeAction"
      :home-weight="homeWeight"
      :home-icon-only="homeIconOnly"
      :languages-count-only="stickyLanguagesCountOnly"
    />
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

.vector-chrome-header__menu-anchor {
  display: inline-flex;
  flex-shrink: 0;
  align-items: center;
  padding-inline-start: var(--spacing-25, 4px);
}

.vector-chrome-header__menu-panel {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-150, 24px);
  min-width: 18rem;
}

/* Grouped by what each knob changes in the bar: Home, the username, the two
   inboxes, then the bar that replaces all of them once the page scrolls. */
.vector-chrome-header__menu-section {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: var(--spacing-100, 16px);
}

/* A rule between sections instead of yet more vertical space. */
.vector-chrome-header__menu-section + .vector-chrome-header__menu-section {
  border-top: var(--border-width-base, 1px) solid var(--border-color-subtle, #c8ccd1);
  padding-top: var(--spacing-150, 24px);
}

.vector-chrome-header__menu-section-title {
  margin: 0;
  border: 0;
  padding: 0;
  font-family: var(--font-family-base);
  font-size: var(--font-size-medium, 1rem);
  font-weight: var(--font-weight-bold, 700);
  line-height: var(--line-height-small, 1.375);
  color: var(--color-base, #202122);
}

/* Fields are spaced by the section's flex gap, not Codex's own margin. */
.vector-chrome-header__menu-panel :deep(.cdx-field) {
  margin: 0;
}

/*
 * CdxToggleSwitch anchors its invisible <input> — the actual control — to the
 * component's right edge. A stretched column (flex's default `align-items:
 * stretch`) therefore drags the input away from the visible switch, leaving
 * only the label clickable. Shrink-wrap it so the two stay aligned.
 */
.vector-chrome-header__menu-panel :deep(.cdx-toggle-switch) {
  align-self: flex-start;
}

.vector-chrome-header :slotted(.chrome-header__menu-btn) {
  flex-shrink: 0;
  min-width: var(--size-icon-medium, 32px);
  height: var(--size-icon-medium, 32px);
  margin: 0;
  padding: var(--spacing-25, 4px);
  padding-inline-start: var(--spacing-50, 8px);
}

.vector-chrome-header__menu-btn :deep(svg) {
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
  gap: 4px;
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
 * Home carries a visible label, so it sizes to its content and never shrinks —
 * the narrow-viewport rule below squares every end-cluster button off at 40px,
 * which would clip the label. Three classes outrank it.
 */
.vector-chrome-header__end .vector-chrome-header__home.cdx-button {
  width: auto;
  flex-shrink: 0;
  gap: var(--spacing-25, 4px);
  padding-inline: var(--spacing-50, 8px);
  white-space: nowrap;
}

/*
 * Carrying the username as a label, the user button sizes to its text and never
 * squares off — the same exemption Home needs from the narrow-viewport rule
 * below, and three classes outrank it.
 */
.vector-chrome-header__end .vector-chrome-header__labelled-user--on.cdx-button,
.vector-chrome-header__end .vector-chrome-header__labelled-user--on :deep(.cdx-button) {
  width: auto;
  flex-shrink: 0;
  gap: var(--spacing-25, 4px);
  padding-inline: var(--spacing-50, 8px);
  white-space: nowrap;
}

/*
 * User menu trigger carries two icons (avatar + chevron), so it opts out of the
 * square icon-only sizing above and sizes to its content instead.
 */
.vector-chrome-header__user-menu :deep(.cdx-button) {
  display: inline-flex;
  gap: var(--spacing-25, 4px);
  align-items: center;
  width: auto;
  padding-inline: var(--spacing-25, 4px);
}

/* Menu items read as links: base-coloured icon, progressive label. */
.vector-chrome-header__user-menu :deep(.cdx-menu-item .cdx-menu-item__icon) {
  color: var(--color-base, #202122);
}

.vector-chrome-header__user-menu :deep(.cdx-menu-item .cdx-menu-item__text__label) {
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
