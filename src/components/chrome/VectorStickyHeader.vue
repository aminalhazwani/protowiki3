<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { CdxButton, CdxIcon, CdxMenuButton } from '@wikimedia/codex'
import type { MenuButtonItemData, MenuItemValue } from '@wikimedia/codex'
import {
  cdxIconBookmark,
  cdxIconEdit,
  cdxIconExpand,
  cdxIconHistory,
  cdxIconHome,
  cdxIconImageGallery,
  cdxIconLabFlask,
  cdxIconLanguage,
  cdxIconLogOut,
  cdxIconSandbox,
  cdxIconSearch,
  cdxIconSettings,
  cdxIconSpeechBubbles,
  cdxIconStar,
  cdxIconUserAvatar,
  cdxIconUserContributions,
  cdxIconUserTalk,
} from '@wikimedia/codex-icons'

import {
  ARTICLE_LANGUAGE_COUNT,
  languagesButtonLabel,
  useArticleLanguageMenu,
} from '@/components/article/shared/articleLanguageMenu'
import { useConfig } from '@/composables/useConfig'
import {
  HOME_BUTTON_COUNT,
  homeButtonAriaLabel,
  type HomeAction,
  type HomeWeight,
} from './homeButtonPlayground'
import { stickyHeaderLanguagesCount, stickyHeaderTitle } from './stickyHeaderSubject'
import type { Theme } from '@/theme'
import { homeButtonLabel, uiLanguageTag } from '@/uiLanguage'

const { user, displayName } = useConfig()

interface Props {
  /** Slid in when **`true`**; parked above the viewport and inert when **`false`**. */
  active?: boolean
  /** Theme to render under — passed down from the chrome header. */
  theme?: Theme
  /** Playground knob: Home button at the head of the tool cluster. */
  showHome?: boolean
  /** Home styling, shared with the site header's own Home button. */
  homeAction?: HomeAction
  homeWeight?: HomeWeight
  homeIconOnly?: boolean
  /** Echo's count badge on Home, so both Home buttons stay in step. */
  homeCount?: boolean
  /** Playground knob: shorten the interlanguage label to the bare count. */
  languagesCountOnly?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  active: false,
  theme: undefined,
  showHome: false,
  homeAction: 'progressive',
  homeWeight: 'quiet',
  homeIconOnly: false,
  homeCount: false,
  languagesCountOnly: false,
})

/** The badge is `aria-hidden`, so the count rides in the accessible name. */
const homeAriaLabel = computed(() =>
  homeButtonAriaLabel(homeButtonLabel.value, props.homeIconOnly, props.homeCount),
)

const isLoggedOut = computed(() => user.value === 'logged-out')

/** Registered by the article surface; empty on pages with no article. */
const title = computed(() => stickyHeaderTitle.value)
/**
 * Page-scoped tools — talk, history, watch, reading lists, edit, languages —
 * only mean something with an article behind them. A special page or dashboard
 * gets the bar too, but reduced to search and the user menu, which is how
 * Vector treats a page with no interlanguage links.
 */
const hasSubject = computed(() => title.value.length > 0)
const languagesCount = computed(() => stickyHeaderLanguagesCount.value ?? ARTICLE_LANGUAGE_COUNT)
const languagesLabel = computed(() => languagesButtonLabel(languagesCount.value))
/**
 * Visible text on the interlanguage button. Shortened to the bare count when
 * the playground asks; the full “N languages” stays on as the `aria-label`,
 * because “445” on its own tells a screen reader nothing.
 */
const languagesButtonText = computed(() =>
  props.languagesCountOnly ? String(languagesCount.value) : languagesLabel.value,
)

const { menuItems: languageMenuItems, selection: langSelection } = useArticleLanguageMenu()

/** Same mocked rows as the site header's user menu. */
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

const userMenuSelection = ref<MenuItemValue | null>(null)

watch(userMenuSelection, (value) => {
  if (value !== null) userMenuSelection.value = null
})
</script>

<template>
  <!--
    `inert` as well as `aria-hidden`: parked off-screen the bar is still in the
    layer, so without it a Tab from the page top lands on a control nobody can
    see. Both flip together with the slide.
  -->
  <div
    class="vector-sticky-header"
    :class="{ 'vector-sticky-header--active': props.active }"
    :data-theme="props.theme"
    :inert="!props.active"
    :aria-hidden="!props.active"
  >
    <CdxButton
      class="vector-sticky-header__search"
      weight="quiet"
      aria-label="Search"
      tag="a"
      href="https://en.wikipedia.org/wiki/Special:Search"
    >
      <CdxIcon :icon="cdxIconSearch" />
    </CdxButton>

    <span class="vector-sticky-header__divider" aria-hidden="true" />

    <!--
      Not an `h1` — the page already has one, and this is a second view of it
      rather than a heading of its own.
    -->
    <p v-if="title" class="vector-sticky-header__title">{{ title }}</p>

    <div class="vector-sticky-header__end">
      <!--
        Site navigation, not a page tool, so it doesn't wait on a registered
        subject the way talk / history / edit do — but it follows the site
        header in staying out of logged-out chrome.
      -->
      <CdxButton
        v-if="props.showHome && !isLoggedOut"
        class="vector-sticky-header__home"
        :class="{ 'cdx-button--icon-only': props.homeIconOnly }"
        :weight="props.homeWeight"
        :action="props.homeAction"
        :aria-label="homeAriaLabel"
      >
        <!--
          Echo's counter, hung off the bottom-trailing corner of whatever the
          button shows — the icon while it's bare, the label once there is one.
          See `chrome-count-badge.css`.
        -->
        <span class="chrome-count-badge">
          <CdxIcon :icon="cdxIconHome" />
          <span
            v-if="props.homeCount && props.homeIconOnly"
            class="chrome-count-badge__count"
            aria-hidden="true"
          >
            {{ HOME_BUTTON_COUNT }}
          </span>
        </span>
        <span v-if="!props.homeIconOnly" class="chrome-count-badge">
          <span :lang="uiLanguageTag" dir="auto">{{ homeButtonLabel }}</span>
          <span v-if="props.homeCount" class="chrome-count-badge__count" aria-hidden="true">
            {{ HOME_BUTTON_COUNT }}
          </span>
        </span>
      </CdxButton>

      <template v-if="hasSubject && !isLoggedOut">
        <CdxButton weight="quiet" aria-label="Talk">
          <CdxIcon :icon="cdxIconSpeechBubbles" />
        </CdxButton>
        <CdxButton weight="quiet" aria-label="View history">
          <CdxIcon :icon="cdxIconHistory" />
        </CdxButton>
        <CdxButton weight="quiet" aria-label="Watch">
          <CdxIcon :icon="cdxIconStar" />
        </CdxButton>
        <CdxButton
          class="vector-sticky-header__hide-narrow"
          weight="quiet"
          aria-label="Reading lists"
        >
          <CdxIcon :icon="cdxIconBookmark" />
        </CdxButton>
        <CdxButton weight="quiet" aria-label="Edit">
          <CdxIcon :icon="cdxIconEdit" />
        </CdxButton>
      </template>

      <CdxMenuButton
        v-if="hasSubject"
        v-model:selected="langSelection"
        class="vector-sticky-header__languages menu-content-width"
        weight="quiet"
        :aria-label="languagesLabel"
        :menu-items="languageMenuItems"
        :menu-config="{ visibleItemLimit: 8 }"
      >
        <CdxIcon :icon="cdxIconLanguage" />
        <span class="vector-sticky-header__languages-label">{{ languagesButtonText }}</span>
        <CdxIcon :icon="cdxIconExpand" size="small" />
      </CdxMenuButton>

      <CdxMenuButton
        v-if="!isLoggedOut"
        v-model:selected="userMenuSelection"
        class="vector-sticky-header__user-menu menu-content-width"
        weight="quiet"
        aria-label="User menu"
        :menu-items="userMenuItems"
      >
        <CdxIcon :icon="cdxIconUserAvatar" />
        <CdxIcon :icon="cdxIconExpand" size="small" />
      </CdxMenuButton>
      <a
        v-else
        class="vector-sticky-header__login"
        href="https://en.wikipedia.org/w/index.php?title=Special:UserLogin"
        rel="noopener noreferrer"
      >
        Log in
      </a>
    </div>
  </div>
</template>

<style scoped>
/*
 * Pinned to the viewport, not to the header it's declared in: the site header
 * scrolls away normally and this overlays the article, which is how Vector 2022
 * behaves. `--z-index-sticky` (100) sits above content but below popovers, so
 * the main menu still draws over it.
 */
.vector-sticky-header {
  position: fixed;
  top: 0;
  inset-inline: 0;
  z-index: var(--z-index-sticky, 100);
  display: flex;
  align-items: center;
  gap: var(--spacing-25, 4px);
  min-height: 50px;
  padding-inline: var(--spacing-100, 16px);
  background-color: var(--background-color-base, #fff);
  border-bottom: 1px solid var(--background-color-interactive, #eaecf0);
  /*
   * `visibility` is transitioned, not faded: it keeps the parked bar out of hit
   * testing without a `display` swap, which would kill the slide.
   */
  visibility: hidden;
  transform: translateY(-100%);
  transition:
    transform var(--transition-duration-medium, 250ms)
      var(--transition-timing-function-system, ease),
    visibility var(--transition-duration-medium, 250ms);
}

.vector-sticky-header--active {
  visibility: visible;
  transform: translateY(0);
}

@media (prefers-reduced-motion: reduce) {
  .vector-sticky-header {
    transition: none;
  }
}

.vector-sticky-header__divider {
  align-self: stretch;
  width: 1px;
  margin-inline: var(--spacing-50, 8px);
  margin-block: var(--spacing-50, 8px);
  background-color: var(--border-color-subtle, #c8ccd1);
}

/*
 * Vector gives the sticky title the first-heading serif at reading size. It's
 * the only flexible item, so a long title ellipses rather than pushing the
 * tools off the edge.
 */
.vector-sticky-header__title {
  flex: 1 1 auto;
  min-width: 0;
  margin: 0;
  overflow: hidden;
  color: var(--color-base, #202122);
  font-family: var(--font-family-heading-main, 'Linux Libertine', 'Georgia', 'Times', serif);
  font-size: var(--font-size-x-large, 1.25rem);
  line-height: 1.3;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.vector-sticky-header__end {
  display: flex;
  align-items: center;
  gap: var(--spacing-25, 4px);
  /* Holds the cluster at the trailing edge on pages with no title to stretch. */
  margin-inline-start: auto;
}

.vector-sticky-header__end .cdx-button {
  min-width: var(--size-icon-medium, 32px);
  height: var(--size-icon-medium, 32px);
  padding: 0.5rem 0.4rem;
}

/*
 * Home carries a visible label unless the playground takes it away, so it sizes
 * to its content and never shrinks — the cluster rule above squares every
 * button off at 32px, which would clip the label.
 */
.vector-sticky-header__end .vector-sticky-header__home.cdx-button {
  width: auto;
  flex-shrink: 0;
  gap: var(--spacing-25, 4px);
  padding-inline: var(--spacing-50, 8px);
  white-space: nowrap;
}

/* Two-icon triggers with a label size to their content instead. */
.vector-sticky-header__languages :deep(.cdx-button),
.vector-sticky-header__user-menu :deep(.cdx-button) {
  display: inline-flex;
  gap: var(--spacing-25, 4px);
  align-items: center;
  width: auto;
  white-space: nowrap;
  padding-inline: var(--spacing-50, 8px);
}

.vector-sticky-header__languages :deep(.cdx-menu-item .cdx-menu-item__icon),
.vector-sticky-header__user-menu :deep(.cdx-menu-item .cdx-menu-item__icon) {
  color: var(--color-base, #202122);
}

.vector-sticky-header__user-menu :deep(.cdx-menu-item .cdx-menu-item__text__label) {
  color: var(--color-progressive, #36c);
}

.vector-sticky-header__login {
  margin-inline-start: var(--spacing-50, 8px);
  color: var(--color-progressive, #36c);
  font-size: var(--font-size-medium, 1rem);
  text-decoration: none;
  white-space: nowrap;
}

a.vector-sticky-header__login:hover {
  text-decoration: underline;
}

/* Parity with the site header: shed the optional tools, then the count label. */
@media (max-width: 768px) {
  .vector-sticky-header__hide-narrow {
    display: none !important;
  }

  .vector-sticky-header__languages-label {
    display: none;
  }
}
</style>
