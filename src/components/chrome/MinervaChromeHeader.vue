<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { RouterLink } from 'vue-router'
import {
  CdxButton,
  CdxField,
  CdxIcon,
  CdxPopover,
  CdxRadio,
  CdxToggleSwitch,
} from '@wikimedia/codex'
import { cdxIconHome, cdxIconMenu } from '@wikimedia/codex-icons'

import { resolveHeaderIcon } from '@/components/header/headerIcons'
import type { HeaderItem } from '@/components/header/headerItems'
import {
  HOME_ACTIONS,
  HOME_SIZES,
  HOME_WEIGHTS,
  useHomeButtonPlayground,
} from './homeButtonPlayground'
import { globalTheme } from '@/theme'
import type { Theme } from '@/theme'
import { homeButtonLabel, uiLanguageTag } from '@/uiLanguage'

export type MinervaHeaderItem = HeaderItem

const WIKIPEDIA_WORDMARK_EN =
  'https://en.wikipedia.org/static/images/mobile/copyright/wikipedia-wordmark-en-25.svg'

const MAX_FLANK_ITEMS = 4

const DEFAULT_RIGHT: HeaderItem[] = [
  { type: 'button', icon: 'search', label: 'Search' },
  { type: 'button', icon: 'bell-outline', label: 'Notifications' },
  { type: 'button', icon: 'user-avatar-outline', label: 'User menu' },
]

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

function clampFlank(items: HeaderItem[], side: 'left' | 'right'): HeaderItem[] {
  if (items.length <= MAX_FLANK_ITEMS) return items
  if (import.meta.env.DEV) {
    console.warn(`[MinervaChromeHeader] ${side} exceeds ${MAX_FLANK_ITEMS} items; truncating.`)
  }
  return items.slice(0, MAX_FLANK_ITEMS)
}

const effectiveLeft = computed(() => clampFlank(props.left ?? [], 'left'))
const effectiveRight = computed(() => clampFlank(props.right ?? DEFAULT_RIGHT, 'right'))
const effectiveMiddle = computed(() => props.middle ?? [])

const useDefaultWordmark = computed(() => props.middle === undefined)
/** No `left` given: render the built-in main-menu disclosure button. */
const useDefaultLeft = computed(() => props.left === undefined)

const hasLeft = computed(() => useDefaultLeft.value || effectiveLeft.value.length > 0)
const hasRight = computed(() => effectiveRight.value.length > 0)

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
 */
const {
  action: homeAction,
  weight: homeWeight,
  size: homeSize,
  iconOnly: homeIconOnly,
  round: homeRound,
} = useHomeButtonPlayground({
  action: 'default',
  weight: 'normal',
  size: 'large',
  iconOnly: true,
  round: false,
})

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
      </div>
    </nav>

    <!--
      Floating Home affordance. Outside `__nav` because it isn't part of the
      bar's layout: it's pinned to the viewport, not to the header.
    -->
    <CdxButton
      class="minerva-chrome-header__home-fab"
      :class="{ 'minerva-chrome-header__home-fab--round': homeRound }"
      :action="homeAction"
      :weight="homeWeight"
      :size="homeSize"
      :aria-label="homeIconOnly ? homeButtonLabel : undefined"
    >
      <CdxIcon :icon="cdxIconHome" />
      <!-- `mobile-frontend-home-button`, in whichever language the
           interlanguage menu last selected. `dir="auto"` keeps RTL
           translations (fa, he) from mirroring the whole button. -->
      <span v-if="!homeIconOnly" :lang="uiLanguageTag" dir="auto">{{ homeButtonLabel }}</span>
    </CdxButton>

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
      <div class="minerva-chrome-header__menu-panel">
        <CdxField :is-fieldset="true">
          <template #label>action</template>
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
          <template #label>weight</template>
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
          <template #label>size</template>
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
      </div>
    </CdxPopover>
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
 * Pinned to the viewport rather than the header, so it stays in the corner
 * while the article scrolls. `inset-inline-end` keeps it on the trailing edge,
 * which mirrors to the left in RTL chrome.
 */
.minerva-chrome-header__home-fab.cdx-button {
  position: fixed;
  bottom: var(--spacing-75, 12px);
  inset-inline-end: var(--spacing-75, 12px);
  z-index: var(--z-index-fixed, 200);
}

/*
 * Fully-round means two different tokens: `border-radius-circle` is a
 * percentage of each axis, so on the wide labelled button it would bow the
 * sides into an ellipse. Codex sets `cdx-button--icon-only` itself from the
 * slot contents, so the shape follows the label without a second flag.
 */
.minerva-chrome-header__home-fab--round.cdx-button {
  border-radius: var(--border-radius-pill, 9999px);
}

.minerva-chrome-header__home-fab--round.cdx-button.cdx-button--icon-only {
  border-radius: var(--border-radius-circle, 50%);
}

/* Narrower than the Vector panel — it has to fit a 320px phone. */
.minerva-chrome-header__menu-panel {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-100, 16px);
  min-width: 13rem;
  max-width: calc(100vw - var(--spacing-100, 16px) * 2);
}

/*
 * CdxToggleSwitch anchors its invisible <input> — the actual control — to the
 * component's right edge. A stretched column (flex's default `align-items:
 * stretch`) therefore drags the input away from the visible switch, leaving
 * only the label clickable. Shrink-wrap it so the two stay aligned.
 */
.minerva-chrome-header__menu-panel :deep(.cdx-toggle-switch) {
  align-self: flex-start;
}
</style>
