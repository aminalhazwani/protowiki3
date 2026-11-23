<script setup lang="ts">
/**
 * "Home in tab bar" variant: Home · Saved · Search, fixed to the bottom of
 * every page (Figma T419358-Home, nodes 2221:72507 default and 2221:72686
 * Home selected). Home and Saved open their pages (and show as selected
 * there); Search opens Minerva's search. It slides away while the reader
 * scrolls down and back as soon as they scroll up (`./useHideOnScroll`).
 * At the end of the page it sits in its own slot under the footer and
 * scrolls in with it, as if it were the page's last block.
 *
 * Icons are `--color-icon-notice`, the selected one `--color-base`. Selected
 * tabs fill in: Home with the design's full house, Saved with Codex's
 * bookmark list. Unselected Saved is the design's empty "saved pages" icon,
 * drawn from Codex's bookmark list (`./savedPagesIcon`) so the swap doesn't
 * shift. The full house is a Figma SVG (`./assets`), painted in the current
 * colour through a CSS mask, since Codex has none.
 */
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { CdxButton, CdxIcon } from '@wikimedia/codex'
import {
  cdxIconBookmarkList,
  cdxIconHome,
  cdxIconSearch,
  type Icon,
} from '@wikimedia/codex-icons'

import MobileSearchOverlay from '@/components/search/MobileSearchOverlay.vue'
import { useConfig } from '@/composables/useConfig'

import fullHouseSvg from './assets/full-house.svg'
import { HOME_NAV_HOME_PATH, HOME_NAV_SAVED_PATH } from './navVariants'
import { savedPagesOutlineIcon } from './savedPagesIcon'
import { useHideOnScroll } from './useHideOnScroll'

/** A Figma SVG at its own size (`width` × `height`), centred in the 20px icon box. */
interface CustomIcon {
  src: string
  width: number
  height: number
}

interface TabItem {
  id: 'home' | 'saved' | 'search'
  label: string
  icon: Icon | CustomIcon
  /** Icon while selected, when it changes. */
  selectedIcon?: Icon | CustomIcon
}

const FULL_HOUSE: CustomIcon = { src: fullHouseSvg, width: 20, height: 20 }

const TABS: TabItem[] = [
  { id: 'home', label: 'Home', icon: cdxIconHome, selectedIcon: FULL_HOUSE },
  { id: 'saved', label: 'Saved', icon: savedPagesOutlineIcon, selectedIcon: cdxIconBookmarkList },
  { id: 'search', label: 'Search', icon: cdxIconSearch },
]

const route = useRoute()
const router = useRouter()
const { lang } = useConfig()

const searchOpen = ref(false)

const hidden = useHideOnScroll(ref(true))
// A new page starts with the bar in view.
watch(
  () => route.fullPath,
  () => (hidden.value = false),
)

/*
 * The in-flow slot under the footer. While it's on screen and the bar has slid
 * away, the bar follows it instead (`--docked`): still the fixed bar, offset
 * down by however much of the slot is below the screen, so reaching the end of
 * the page scrolls it in with the footer rather than sliding it up. Scrolling
 * up from there reveals it at once — the offset (a few px at most) eases back
 * to 0 with the slide-in curve — so it never dips with the page first.
 */
const slot = ref<HTMLElement | null>(null)
/** px the docked bar sits below its resting place; `null` when not docked. */
const dockOffset = ref<number | null>(null)

let lastY = 0
let frame = 0

function measure(): void {
  frame = 0
  const y = window.scrollY
  const scrollingUp = y < lastY
  lastY = y
  // Scrolling up from the slot: show the bar where it is, no 16px dip first.
  if (dockOffset.value !== null && scrollingUp) hidden.value = false

  const el = slot.value
  if (!el) return
  const height = el.offsetHeight
  const top = el.getBoundingClientRect().top
  const below = top - (window.innerHeight - height)
  dockOffset.value =
    hidden.value && top < window.innerHeight ? Math.min(Math.max(below, 0), height) : null
}

function scheduleMeasure(): void {
  if (!frame) frame = requestAnimationFrame(measure)
}

watch(hidden, scheduleMeasure, { flush: 'post' })

onMounted(() => {
  lastY = window.scrollY
  window.addEventListener('scroll', scheduleMeasure, { passive: true })
  window.addEventListener('resize', scheduleMeasure, { passive: true })
  scheduleMeasure()
})
onBeforeUnmount(() => {
  window.removeEventListener('scroll', scheduleMeasure)
  window.removeEventListener('resize', scheduleMeasure)
  if (frame) cancelAnimationFrame(frame)
})

/** Tabs that are pages, and where they lead. */
const TAB_PATHS: Partial<Record<TabItem['id'], string>> = {
  home: HOME_NAV_HOME_PATH,
  saved: HOME_NAV_SAVED_PATH,
}

function isSelected(item: TabItem): boolean {
  return route.path === TAB_PATHS[item.id]
}

function iconFor(item: TabItem): Icon | CustomIcon {
  return isSelected(item) && item.selectedIcon ? item.selectedIcon : item.icon
}

function isCustomIcon(icon: Icon | CustomIcon): icon is CustomIcon {
  return typeof icon === 'object' && icon !== null && 'src' in icon
}

function onClick(item: TabItem): void {
  if (item.id === 'search') {
    searchOpen.value = true
    return
  }
  const path = TAB_PATHS[item.id]
  if (path && route.path !== path) void router.push(path)
}
</script>

<template>
  <!-- In-flow slot the bar's height, under the footer: the page's end is never covered, and the bar docks here at the end. -->
  <div ref="slot" class="nav-tab-bar">
    <nav
      class="nav-tab-bar__bar"
      :class="{
        'nav-tab-bar__bar--hidden': hidden && dockOffset === null,
        'nav-tab-bar__bar--docked': dockOffset !== null,
      }"
      :style="dockOffset !== null ? { transform: `translateY(${dockOffset}px)` } : undefined"
      aria-label="Tab bar"
    >
      <CdxButton
        v-for="item in TABS"
        :key="item.id"
        class="nav-tab-bar__item"
        :class="{ 'nav-tab-bar__item--selected': isSelected(item) }"
        weight="quiet"
        :aria-label="item.label"
        :aria-current="isSelected(item) ? 'page' : undefined"
        @click="onClick(item)"
      >
        <span
          v-if="isCustomIcon(iconFor(item))"
          class="nav-tab-bar__icon nav-tab-bar__custom-icon"
          aria-hidden="true"
        >
          <span
            class="nav-tab-bar__custom-icon-shape"
            :style="{
              width: `${(iconFor(item) as CustomIcon).width}px`,
              height: `${(iconFor(item) as CustomIcon).height}px`,
              '--nav-tab-bar-icon': `url(${JSON.stringify((iconFor(item) as CustomIcon).src)})`,
            }"
          />
        </span>
        <CdxIcon v-else class="nav-tab-bar__icon" :icon="iconFor(item) as Icon" />
      </CdxButton>
    </nav>
    <MobileSearchOverlay v-if="searchOpen" :lang="lang" @close="searchOpen = false" />
  </div>
</template>

<style scoped>
.nav-tab-bar {
  --nav-tab-bar-height: 56px;
  position: relative;
  flex-shrink: 0;
  height: var(--nav-tab-bar-height);
}

/* Figma: 56px tall, 48px side padding, subtle top border, three equal buttons. */
.nav-tab-bar__bar {
  position: fixed;
  inset-inline: 0;
  bottom: 0;
  z-index: var(--z-index-fixed, 200);
  display: flex;
  align-items: center;
  box-sizing: border-box;
  height: var(--nav-tab-bar-height);
  padding-inline: var(--spacing-300, 48px);
  border-top: var(--border-width-base, 1px) var(--border-style-base, solid)
    var(--border-color-subtle, #c8ccd1);
  background-color: var(--background-color-base, #fff);
  /*
   * Slides out straight down and back up, as the floating Home button on the
   * `home-navigation` branch: a transition (not keyframes), so flicking back
   * up mid-slide reverses it from where it is; `visibility` rides along to
   * take the parked bar out of hit testing and the tab order. Codex's easings
   * are too soft for this — a strong ease-out.
   */
  transition:
    transform var(--transition-duration-medium, 250ms) cubic-bezier(0.23, 1, 0.32, 1),
    visibility var(--transition-duration-medium, 250ms);
}

/* Its full height, top border included (border-box), so it clears the screen. */
.nav-tab-bar__bar--hidden {
  visibility: hidden;
  transform: translateY(100%);
}

/* At the end of the page: over its slot under the footer, following the scroll exactly — placed, not animated. */
.nav-tab-bar__bar--docked {
  transition: none;
}

/* Reduced motion: no travel, just a fade. */
@media (prefers-reduced-motion: reduce) {
  .nav-tab-bar__bar {
    transition:
      opacity var(--transition-duration-medium, 250ms) ease-out,
      visibility var(--transition-duration-medium, 250ms);
  }

  .nav-tab-bar__bar--hidden {
    transform: none;
    opacity: 0;
  }
}

/* CODEX+ Button: no tab-bar item — full-height, equal-width quiet buttons. */
.nav-tab-bar__item.cdx-button {
  flex: 1 0 0;
  min-width: 0;
  max-width: none;
  height: 100%;
  min-height: 0;
  padding: var(--spacing-25, 4px);
  border: 0;
  border-radius: 0;
}

/* CODEX+ Button: no background on hover or press — the icon darkens instead (below). */
.nav-tab-bar__item.cdx-button:enabled:hover,
.nav-tab-bar__item.cdx-button:enabled:active {
  background-color: transparent;
}

/* Press looks like hover, on touch screens too. */
.nav-tab-bar__item.cdx-button:enabled:active .nav-tab-bar__icon {
  color: var(--color-base, #202122);
}

/* CODEX+ Button: quiet buttons colour their icon; the bar's icons are notice grey, base when selected. */
.nav-tab-bar__icon {
  color: var(--color-icon-notice, #72777d);
}

.nav-tab-bar__item--selected .nav-tab-bar__icon {
  color: var(--color-base, #202122);
}

/* Hover: base colour, same icon (Home stays the outline house until selected). Pointer devices only, so a tap doesn't leave it dark. */
@media (hover: hover) {
  .nav-tab-bar__item.cdx-button:enabled:hover .nav-tab-bar__icon {
    color: var(--color-base, #202122);
  }
}

/* The 20px icon box; the Figma shape sits centred in it, overhang and all. */
.nav-tab-bar__custom-icon {
  display: inline-flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  width: var(--size-icon-medium, 20px);
  height: var(--size-icon-medium, 20px);
}

/* The SVG is a mask, so it paints in the icon colour above. */
.nav-tab-bar__custom-icon-shape {
  flex-shrink: 0;
  background-color: currentColor;
  mask: var(--nav-tab-bar-icon) center / 100% 100% no-repeat;
}
</style>
