<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { RouterLink } from 'vue-router'
import {
  CdxButton,
  CdxField,
  CdxIcon,
  CdxMenu,
  CdxPopover,
  CdxRadio,
  CdxToggleSwitch,
} from '@wikimedia/codex'
import type { MenuItemData, MenuItemValue } from '@wikimedia/codex'
import {
  cdxIconBookmarkList,
  cdxIconHelp,
  cdxIconHome,
  cdxIconLogOut,
  cdxIconMenu,
  cdxIconSandbox,
  cdxIconUserAvatar,
  cdxIconUserAvatarOutline,
  cdxIconUserContributions,
  cdxIconUserTalk,
  cdxIconWatchlist,
} from '@wikimedia/codex-icons'

import { useConfig } from '@/composables/useConfig'
import { resolveHeaderIcon } from '@/components/header/headerIcons'
import type { HeaderItem } from '@/components/header/headerItems'
import MobileSearchOverlay from '@/components/search/MobileSearchOverlay.vue'
import {
  HOME_ACTIONS,
  HOME_BUTTON_COUNT,
  HOME_SIZES,
  HOME_WEIGHTS,
  homeButtonAriaLabel,
  useHomeButtonPlayground,
} from './homeButtonPlayground'
import { HELP_BUTTON_LABEL, helpButtonVisible } from './helpButton'
import { globalTheme } from '@/theme'
import type { Theme } from '@/theme'
import { homeButtonLabel, uiLanguageTag } from '@/uiLanguage'

export type MinervaHeaderItem = HeaderItem

const WIKIPEDIA_WORDMARK_EN =
  'https://en.wikipedia.org/static/images/mobile/copyright/wikipedia-wordmark-en-25.svg'

const MAX_FLANK_ITEMS = 4

interface Props {
  theme?: Theme
  left?: HeaderItem[]
  middle?: HeaderItem[]
  right?: HeaderItem[]
  /** Wordmark image URL when **`middle`** is omitted. */
  wordmarkSrc?: string
  /** Minerva wordmark; defaults to **`wordmarkSrc`** then EN constant. */
  mobileWordmarkSrc?: string
}

const props = withDefaults(defineProps<Props>(), {
  theme: undefined,
  left: undefined,
  middle: undefined,
  right: undefined,
  wordmarkSrc: undefined,
  mobileWordmarkSrc: undefined,
})

const effectiveTheme = computed<Theme>(() => props.theme ?? globalTheme.value)

const wordmarkResolved = computed(
  () => props.mobileWordmarkSrc ?? props.wordmarkSrc ?? WIKIPEDIA_WORDMARK_EN,
)

/**
 * Full-screen search, the way Minerva does it — the icon swaps the whole screen
 * for a search bar and title suggestions rather than opening a dropdown. Where a
 * picked result lands is the page's call: the overlay routes it through the
 * registered `articleOpener`, so a prototype that can render an arbitrary
 * article keeps the reader inside ProtoWiki. Prototypes wanting a different
 * search entirely pass `right` with a search button of their own, which leaves
 * this built-in one out of the bar.
 */
const searchOpen = ref(false)

/**
 * The search button and the avatar that opens the user menu are both built in —
 * see `useDefaultRight`.
 */
const defaultRight = computed((): HeaderItem[] => [
  { type: 'button', icon: 'search', label: 'Search', onClick: () => (searchOpen.value = true) },
  { type: 'button', icon: 'bell-outline', label: 'Notifications' },
])

/**
 * User menu. The real Minerva avatar opens a whole page; on a prototype phone
 * screen the rows read better hanging off the bar, so the built-in avatar
 * button (rendered whenever `right` is left to its default, the same way the
 * hamburger is) toggles a Codex menu instead.
 */
const userMenuOpen = ref(false)
const userMenu = ref<InstanceType<typeof CdxMenu> | null>(null)
const userMenuTrigger = ref<InstanceType<typeof CdxButton> | null>(null)
const userMenuSelection = ref<MenuItemValue | null>(null)

const { displayName } = useConfig()

const userMenuItems = computed((): MenuItemData[] => [
  { value: 'user-page', label: displayName.value, icon: cdxIconUserAvatar },
  { value: 'talk', label: 'Talk', icon: cdxIconUserTalk },
  { value: 'sandbox', label: 'Sandbox', icon: cdxIconSandbox },
  { value: 'saved', label: 'Saved', icon: cdxIconBookmarkList },
  { value: 'watchlist', label: 'Watchlist', icon: cdxIconWatchlist },
  { value: 'contributions', label: 'Contributions', icon: cdxIconUserContributions },
  { value: 'log-out', label: 'Log out', icon: cdxIconLogOut },
])

/** Mock rows: clear the pick so no row keeps the selected (blue) treatment. */
watch(userMenuSelection, (value) => {
  if (value !== null) userMenuSelection.value = null
})

/** Menu rows are `<li>`s, so arrow/Enter/Escape only work if the focused
    trigger hands its keystrokes to the menu — what CdxMenuButton does too. */
function onUserMenuKeydown(event: KeyboardEvent) {
  if (event.key === ' ') return
  userMenu.value?.delegateKeyNavigation(event)
}

function onDocumentPointerDown(event: PointerEvent) {
  const target = event.target as Node | null
  if (!target) return
  if (userMenu.value?.getRootElement()?.contains(target)) return
  if (userMenuTrigger.value?.$el?.contains(target)) return
  userMenuOpen.value = false
}

/*
 * Codex menu items swallow `mousedown`, so a tap on a row never blurs the
 * trigger — which is why closing on an outside tap needs its own listener
 * rather than the trigger's `blur` (Safari doesn't focus buttons on click).
 */
watch(userMenuOpen, (open) => {
  if (open) {
    document.addEventListener('pointerdown', onDocumentPointerDown)
  } else {
    document.removeEventListener('pointerdown', onDocumentPointerDown)
  }
})

onBeforeUnmount(() => {
  document.removeEventListener('pointerdown', onDocumentPointerDown)
})

function clampFlank(items: HeaderItem[], side: 'left' | 'right'): HeaderItem[] {
  if (items.length <= MAX_FLANK_ITEMS) return items
  if (import.meta.env.DEV) {
    console.warn(`[MinervaChromeHeader] ${side} exceeds ${MAX_FLANK_ITEMS} items; truncating.`)
  }
  return items.slice(0, MAX_FLANK_ITEMS)
}

const effectiveLeft = computed(() => clampFlank(props.left ?? [], 'left'))
const effectiveRight = computed(() => clampFlank(props.right ?? defaultRight.value, 'right'))
const effectiveMiddle = computed(() => props.middle ?? [])

const useDefaultWordmark = computed(() => props.middle === undefined)
/** No `left` given: render the built-in main-menu disclosure button. */
const useDefaultLeft = computed(() => props.left === undefined)
/** No `right` given: render the built-in avatar button and its user menu. */
const useDefaultRight = computed(() => props.right === undefined)

const hasLeft = computed(() => useDefaultLeft.value || effectiveLeft.value.length > 0)
const hasRight = computed(() => useDefaultRight.value || effectiveRight.value.length > 0)

const showMiddle = computed(() => {
  if (!hasLeft.value || !hasRight.value) return false
  if (useDefaultWordmark.value) return true
  return effectiveMiddle.value.length > 0
})

if (import.meta.env.DEV) {
  watch(
    () => [props.middle?.length ?? 0, hasLeft.value, hasRight.value] as const,
    ([middleCount, left, right]) => {
      if (middleCount > 0 && !(left && right)) {
        console.warn(
          '[MinervaChromeHeader] middle is ignored unless both left and right are present.',
        )
      }
    },
    { immediate: true },
  )
}

function isExternalHref(href: string): boolean {
  return href.startsWith('http://') || href.startsWith('https://')
}

/** Main-menu popover — Home button playground, anchored to the hamburger. */
const mainMenuOpen = ref(false)
const mainMenuAnchor = ref<HTMLElement | null>(null)

/**
 * Minerva floats Home over the article instead of seating it in a bar, so it
 * starts framed (`normal`), thumb-sized (`large`), icon-only and square-ish — a
 * labelled pill would cover more of the text it sits on.
 *
 * The floating help button sits in the same corner cluster and follows the same
 * knobs: two buttons side by side only read as a pair if they share a
 * treatment, so the playground styles the cluster rather than one button.
 */
const {
  action: homeAction,
  weight: homeWeight,
  size: homeSize,
  iconOnly: homeIconOnly,
  round: homeRound,
  count: homeCount,
} = useHomeButtonPlayground({
  action: 'default',
  weight: 'normal',
  size: 'large',
  iconOnly: true,
  round: false,
  count: false,
})

/** The count belongs to Home alone — help has nothing to count. */
const homeAriaLabel = computed(() =>
  homeButtonAriaLabel(homeButtonLabel.value, homeIconOnly.value, homeCount.value),
)

/** The control reads as “show the label”; the shared state stores its inverse. */
const homeShowLabel = computed({
  get: () => !homeIconOnly.value,
  set: (value: boolean) => {
    homeIconOnly.value = !value
  },
})
</script>

<template>
  <header class="minerva-chrome-header" data-skin="mobile" :data-theme="effectiveTheme">
    <nav class="minerva-chrome-header__nav" aria-label="Site">
      <div v-if="hasLeft" ref="mainMenuAnchor" class="minerva-chrome-header__left">
        <CdxButton
          v-if="useDefaultLeft"
          weight="quiet"
          size="large"
          aria-label="Main menu"
          :aria-expanded="mainMenuOpen"
          aria-haspopup="dialog"
          @click="mainMenuOpen = !mainMenuOpen"
        >
          <CdxIcon :icon="cdxIconMenu" />
        </CdxButton>
        <template v-for="(item, index) in effectiveLeft" :key="`left-${index}`">
          <component
            v-if="item.type === 'component'"
            :is="item.component"
            class="minerva-chrome-header__region-component"
          />
          <RouterLink
            v-else-if="item.type === 'link' && item.href && !isExternalHref(item.href)"
            class="minerva-chrome-header__link"
            :to="item.href"
            :aria-label="item.label"
          >
            <CdxIcon :icon="resolveHeaderIcon(item.icon)!" />
          </RouterLink>
          <a
            v-else-if="item.type === 'link' && item.href && isExternalHref(item.href)"
            class="minerva-chrome-header__link"
            :href="item.href"
            :aria-label="item.label"
          >
            <CdxIcon :icon="resolveHeaderIcon(item.icon)!" />
          </a>
          <CdxButton
            v-else-if="item.type === 'button'"
            weight="quiet"
            size="large"
            :aria-label="item.label"
            @click="item.onClick?.()"
          >
            <CdxIcon :icon="resolveHeaderIcon(item.icon)!" />
          </CdxButton>
        </template>
      </div>

      <div v-if="showMiddle" class="minerva-chrome-header__middle">
        <RouterLink
          v-if="useDefaultWordmark"
          class="minerva-chrome-header__brand"
          to="/"
          aria-label="Visit the main page"
        >
          <img
            class="minerva-chrome-header__wordmark-img"
            :src="wordmarkResolved"
            alt="Wikipedia"
          />
        </RouterLink>
        <template v-else v-for="(item, index) in effectiveMiddle" :key="`middle-${index}`">
          <component
            v-if="item.type === 'component'"
            :is="item.component"
            class="minerva-chrome-header__region-component"
          />
          <RouterLink
            v-else-if="item.type === 'link' && item.href && !isExternalHref(item.href)"
            class="minerva-chrome-header__link"
            :to="item.href"
            :aria-label="item.label"
          >
            <CdxIcon :icon="resolveHeaderIcon(item.icon)!" />
          </RouterLink>
          <a
            v-else-if="item.type === 'link' && item.href && isExternalHref(item.href)"
            class="minerva-chrome-header__link"
            :href="item.href"
            :aria-label="item.label"
          >
            <CdxIcon :icon="resolveHeaderIcon(item.icon)!" />
          </a>
          <CdxButton
            v-else-if="item.type === 'button'"
            weight="quiet"
            size="large"
            :aria-label="item.label"
            @click="item.onClick?.()"
          >
            <CdxIcon :icon="resolveHeaderIcon(item.icon)!" />
          </CdxButton>
        </template>
      </div>

      <div v-if="hasRight" class="minerva-chrome-header__right">
        <template v-for="(item, index) in effectiveRight" :key="`right-${index}`">
          <component
            v-if="item.type === 'component'"
            :is="item.component"
            class="minerva-chrome-header__region-component"
          />
          <RouterLink
            v-else-if="item.type === 'link' && item.href && !isExternalHref(item.href)"
            class="minerva-chrome-header__link"
            :to="item.href"
            :aria-label="item.label"
          >
            <CdxIcon :icon="resolveHeaderIcon(item.icon)!" />
          </RouterLink>
          <a
            v-else-if="item.type === 'link' && item.href && isExternalHref(item.href)"
            class="minerva-chrome-header__link"
            :href="item.href"
            :aria-label="item.label"
          >
            <CdxIcon :icon="resolveHeaderIcon(item.icon)!" />
          </a>
          <CdxButton
            v-else-if="item.type === 'button'"
            weight="quiet"
            size="large"
            :aria-label="item.label"
            @click="item.onClick?.()"
          >
            <CdxIcon
              :icon="resolveHeaderIcon(item.icon)!"
              :size="item.icon === 'user-avatar-outline' ? 'medium' : undefined"
            />
          </CdxButton>
        </template>
        <CdxButton
          v-if="useDefaultRight"
          ref="userMenuTrigger"
          weight="quiet"
          size="large"
          aria-label="User menu"
          aria-haspopup="menu"
          :aria-expanded="userMenuOpen"
          @click="userMenuOpen = !userMenuOpen"
          @keydown="onUserMenuKeydown"
        >
          <CdxIcon :icon="cdxIconUserAvatarOutline" size="medium" />
        </CdxButton>
        <!--
          Inside the end cluster so the menu hangs 4px under the avatar rather
          than under the whole bar. It's absolutely positioned, so it never
          becomes a flex item in the row.
        -->
        <CdxMenu
          v-if="useDefaultRight"
          ref="userMenu"
          v-model:selected="userMenuSelection"
          v-model:expanded="userMenuOpen"
          class="minerva-chrome-header__user-menu"
          :menu-items="userMenuItems"
          role="menu"
          aria-label="User menu"
        />
      </div>
    </nav>

    <!--
      Floating affordances. Outside `__nav` because they aren't part of the
      bar's layout: the cluster is pinned to the viewport, not to the header.
      Home leads and help closes it, so help is the one nearest the corner —
      the thumb's shortest reach, and it's the button that comes and goes.
    -->
    <div class="minerva-chrome-header__fabs">
      <!--
        `cdx-button--icon-only` is set by hand because Codex reads its own off
        the slot: one child, and that child an icon. The count badge wraps the
        icon in a positioning layer, which the detection misses — and both the
        square 44px FAB and the `--round` circle key off that class. The help
        FAB below carries a bare icon, so Codex still sets it there.
      -->
      <CdxButton
        class="minerva-chrome-header__fab"
        :class="{
          'minerva-chrome-header__fab--round': homeRound,
          'cdx-button--icon-only': homeIconOnly,
        }"
        :action="homeAction"
        :weight="homeWeight"
        :size="homeSize"
        :aria-label="homeAriaLabel"
      >
        <!-- Echo's counter, pinned to the icon — see `chrome-count-badge.css`. -->
        <span class="chrome-count-badge" :class="{ 'chrome-count-badge--counted': homeCount }">
          <CdxIcon :icon="cdxIconHome" />
          <span v-if="homeCount" class="chrome-count-badge__count" aria-hidden="true">
            {{ HOME_BUTTON_COUNT }}
          </span>
        </span>
        <!-- `mobile-frontend-home-button`, in whichever language the
             interlanguage menu last selected. `dir="auto"` keeps RTL
             translations (fa, he) from mirroring the whole button. -->
        <span v-if="!homeIconOnly" :lang="uiLanguageTag" dir="auto">{{ homeButtonLabel }}</span>
      </CdxButton>

      <!-- Project, user and help pages only — see `./helpButton`. -->
      <CdxButton
        v-if="helpButtonVisible"
        class="minerva-chrome-header__fab"
        :class="{ 'minerva-chrome-header__fab--round': homeRound }"
        :action="homeAction"
        :weight="homeWeight"
        :size="homeSize"
        :aria-label="homeIconOnly ? HELP_BUTTON_LABEL : undefined"
      >
        <CdxIcon :icon="cdxIconHelp" />
        <span v-if="!homeIconOnly">{{ HELP_BUTTON_LABEL }}</span>
      </CdxButton>
    </div>

    <!--
      Anchored to the hamburger but outside `__nav`: with `render-in-place` the
      popover's backdrop is a static-flow element, so inside the flex row it
      would become a flex item and shift the wordmark.
    -->
    <CdxPopover
      v-model:open="mainMenuOpen"
      :anchor="mainMenuAnchor"
      placement="bottom-start"
      render-in-place
    >
      <!--
        Same sectioned frame as the Vector panel — titled group, fields above
        the switches — so the two playgrounds read alike. Minerva has no sticky
        bar and no username affordance in the chrome, so the floating cluster is
        the only group here; the section keeps its heading anyway, ready for a
        second one.
      -->
      <div class="minerva-chrome-header__menu-panel chrome-playground-panel">
        <section class="chrome-playground-panel__section">
          <h2 class="chrome-playground-panel__section-title">Floating buttons</h2>

          <CdxField :is-fieldset="true">
            <template #label>Action</template>
            <CdxRadio
              v-for="value in HOME_ACTIONS"
              :key="value"
              v-model="homeAction"
              :input-value="value"
              name="minerva-home-action"
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
              name="minerva-home-weight"
              inline
            >
              {{ value }}
            </CdxRadio>
          </CdxField>

          <CdxField :is-fieldset="true">
            <template #label>Size</template>
            <CdxRadio
              v-for="value in HOME_SIZES"
              :key="value"
              v-model="homeSize"
              :input-value="value"
              name="minerva-home-size"
              inline
            >
              {{ value }}
            </CdxRadio>
          </CdxField>

          <CdxToggleSwitch v-model="homeShowLabel">Show label</CdxToggleSwitch>
          <CdxToggleSwitch v-model="homeRound">Fully round</CdxToggleSwitch>
          <!-- Home only: a count on help would have nothing behind it. -->
          <CdxToggleSwitch v-model="homeCount">Show count on Home</CdxToggleSwitch>
        </section>
      </div>
    </CdxPopover>

    <!--
      Teleported to the body so the fixed overlay escapes the header's stacking
      context — otherwise a prototype that transforms or clips its chrome would
      confine the "full screen" search to the bar.
    -->
    <Teleport to="body">
      <MobileSearchOverlay v-if="searchOpen" :theme="effectiveTheme" @close="searchOpen = false" />
    </Teleport>
  </header>
</template>

<style scoped>
.minerva-chrome-header {
  border-bottom: 1px solid var(--border-color-subtle, #c8ccd1);
}

.minerva-chrome-header__nav {
  display: flex;
  align-items: center;
  gap: var(--spacing-50, 8px);
  min-height: 3.375em;
  padding: 0 var(--spacing-50, 8px) 0 var(--spacing-25, 4px);
  background-color: var(--background-color-interactive, #eaecf0);
  box-shadow: inset 0 -1px 3px 0 rgba(0, 0, 0, 0.08);
}

.minerva-chrome-header__left {
  display: flex;
  flex-shrink: 0;
  align-items: center;
}

.minerva-chrome-header__left :deep(.prototype-chrome-menu-popover) {
  flex-shrink: 0;
}

.minerva-chrome-header__middle {
  flex: 0 1 auto;
  max-width: fit-content;
  min-width: 0;
  overflow: hidden;
  display: flex;
  align-items: center;
}

.minerva-chrome-header__brand {
  text-decoration: none;
  color: inherit;
}

.minerva-chrome-header__brand:hover {
  text-decoration: none;
  color: inherit;
}

.minerva-chrome-header__wordmark-img {
  display: block;
  height: 21px;
  width: auto;
  opacity: 0.67;
}

.minerva-chrome-header[data-theme='dark'] .minerva-chrome-header__wordmark-img {
  opacity: 0;
}

.minerva-chrome-header__right {
  display: flex;
  flex-shrink: 0;
  align-items: center;
  /* Positioning context for the user menu, which hangs off the avatar. */
  position: relative;
  margin-inline-start: auto;
}

/* Equal square touch targets — no gap between adjacent icon buttons/links. */
.minerva-chrome-header__right :deep(.cdx-button) {
  box-sizing: border-box;
  flex-shrink: 0;
  width: var(--size-icon-large, 40px);
  min-width: var(--size-icon-large, 40px);
  max-width: var(--size-icon-large, 40px);
  height: var(--size-icon-large, 40px);
  min-height: var(--size-icon-large, 40px);
  padding: 0;
  color: var(--color-subtle, #54595d);
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.minerva-chrome-header__left :deep(.cdx-button) {
  box-sizing: border-box;
  flex-shrink: 0;
  width: var(--size-icon-large, 40px);
  min-width: var(--size-icon-large, 40px);
  max-width: var(--size-icon-large, 40px);
  height: var(--size-icon-large, 40px);
  min-height: var(--size-icon-large, 40px);
  padding: 0;
  color: var(--color-subtle, #54595d);
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.minerva-chrome-header__link {
  display: inline-flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  width: var(--size-icon-large, 40px);
  height: var(--size-icon-large, 40px);
  color: var(--color-subtle, #54595d);
  text-decoration: none;
}

.minerva-chrome-header__link:visited,
.minerva-chrome-header__link:hover {
  color: var(--color-subtle, #54595d);
  text-decoration: none;
}

/*
 * Pinned to the viewport rather than the header, so the cluster stays in the
 * corner while the article scrolls. `inset-inline-end` keeps it on the trailing
 * edge, which mirrors to the left in RTL chrome — and with it the order of the
 * row, so help stays the button nearest the corner either way.
 */
.minerva-chrome-header__fabs {
  position: fixed;
  bottom: var(--spacing-75, 12px);
  inset-inline-end: var(--spacing-75, 12px);
  z-index: var(--z-index-fixed, 200);
  display: flex;
  align-items: center;
  gap: var(--spacing-50, 8px);
}

/*
 * Fully-round means two different tokens: `border-radius-circle` is a
 * percentage of each axis, so on the wide labelled button it would bow the
 * sides into an ellipse. Codex sets `cdx-button--icon-only` itself from the
 * slot contents, so the shape follows the label without a second flag.
 */
.minerva-chrome-header__fab--round.cdx-button {
  border-radius: var(--border-radius-pill, 9999px);
}

.minerva-chrome-header__fab--round.cdx-button.cdx-button--icon-only {
  border-radius: var(--border-radius-circle, 50%);
}

/* Sections, titles and Codex overrides come from `chrome-playground-panel`,
   shared with the Vector panel. The widths are this panel's own: narrower than
   Vector's, and clamped, because it has to fit a 320px phone. */
.minerva-chrome-header__menu-panel {
  min-width: 13rem;
  max-width: calc(100vw - var(--spacing-100, 16px) * 2);
}
</style>

<!--
  CdxMenu's root element doesn't pick up the scope attribute, so these rules
  can't live in the scoped block above. The class is component-specific, so the
  reach is the same in practice.
-->
<style>
/*
 * 4px under the avatar's own bottom edge — `top: 100%` is the end cluster,
 * whose height is the 40px button row. CdxMenu places itself at `left: 0` and
 * the full width of that cluster, so both are replaced; `inset-inline-end`
 * keeps it flush with the avatar and mirrors to the left in RTL chrome.
 */
.minerva-chrome-header__user-menu.cdx-menu {
  top: 100%;
  left: auto;
  inset-inline-end: 0;
  width: max-content;
  min-width: 13rem;
  max-width: calc(100vw - var(--spacing-100, 16px) * 2);
  margin-top: var(--spacing-25, 4px);
}

/* Thumb-sized rows (44px), against Codex's denser 38px default. */
.minerva-chrome-header__user-menu .cdx-menu-item {
  padding: var(--spacing-75, 12px) var(--spacing-100, 16px);
}

/*
 * The mobile user menu is drawn in one subtle grey — the same `color-subtle`
 * as the bar's icons — rather than Codex's `color-base` rows, and its labels
 * carry the emphasis instead of the colour.
 */
.minerva-chrome-header__user-menu .cdx-menu-item--enabled,
.minerva-chrome-header__user-menu .cdx-menu-item--enabled .cdx-menu-item__content {
  color: var(--color-subtle, #54595d);
}

.minerva-chrome-header__user-menu .cdx-menu-item__icon.cdx-icon {
  margin-inline-end: var(--spacing-75, 12px);
  color: var(--color-subtle, #54595d);
}

.minerva-chrome-header__user-menu .cdx-menu-item__text__label {
  font-weight: var(--font-weight-semi-bold, 600);
}
</style>
