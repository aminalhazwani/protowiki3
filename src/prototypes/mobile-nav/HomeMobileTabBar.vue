<script setup lang="ts">
/**
 * Mobile tab bar (styles from the `tab-bar` branch's `MobileToolbar`): Home,
 * then the tabs set in "Prototype settings" → Mobile tab bar. The same bar on
 * every page; it slides away while the reader scrolls down and back on scroll up.
 *
 * Destinations: Special:Search opens Minerva's search, Special:Random a random
 * article, Special:Nearby the prototype's own, other special pages leave the
 * prototype (after asking), and any other title opens in the prototype.
 */
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { CdxButton, CdxIcon } from '@wikimedia/codex'
import { cdxIconHome } from '@wikimedia/codex-icons'
import type { Icon } from '@wikimedia/codex-icons'

import MobileSearchOverlay from '@/components/search/MobileSearchOverlay.vue'
import { useConfig } from '@/composables/useConfig'

import { resolveCodexIcon } from './data/codexIcons'
import { HOME_PATH, homeArticleLocation, normalizeTitle, titleFromRouteParam } from './routes'
import { useHideOnScroll } from './useHideOnScroll'
import { useHomeLeavePrototype } from './useHomeLeavePrototype'
import { tabBarInset, useHomeTabBar } from './useHomeTabBar'

interface TabItem {
  id: string
  icon: Icon
  label: string
  /** Page title in display form; `null` for Home. */
  destination: string | null
  selected: boolean
}

const route = useRoute()
const router = useRouter()
const { lang } = useConfig()
const { slots } = useHomeTabBar()
const { requestLeave } = useHomeLeavePrototype()
const { hidden, show } = useHideOnScroll()

const searchOpen = ref(false)

/** `Special:ReadingLists` → "Reading lists"; other titles as they are. */
function labelFor(destination: string): string {
  const name = destination.replace(/^Special:/i, '')
  if (name === destination) return destination
  const spaced = name.replace(/([a-z])([A-Z])/g, '$1 $2')
  return spaced.charAt(0) + spaced.slice(1).toLowerCase()
}

/** The article on screen, or `null` on the Home and its module pages. */
const currentTitle = computed(() => {
  const param = (route.params as { title?: string | string[] }).title
  return param ? titleFromRouteParam(param) : null
})

const homeSelected = computed(
  () => route.path === HOME_PATH || 'module' in (route.params as object),
)

const items = computed<TabItem[]>(() => {
  const tabs: TabItem[] = [
    {
      id: 'home',
      icon: cdxIconHome,
      label: 'Home',
      destination: null,
      selected: homeSelected.value,
    },
  ]
  for (const slot of slots.value) {
    const icon = resolveCodexIcon(slot.icon)
    if (!icon || !slot.destination) continue
    tabs.push({
      id: slot.id,
      icon,
      label: labelFor(slot.destination),
      destination: slot.destination,
      selected: currentTitle.value === normalizeTitle(slot.destination),
    })
  }
  return tabs
})

// A new page starts with the bar in view.
watch(() => route.fullPath, show)

/** Matches `--home-tab-bar-height`. */
const BAR_HEIGHT = 56
watch(hidden, (isHidden) => (tabBarInset.value = isHidden ? 0 : BAR_HEIGHT), { immediate: true })
onBeforeUnmount(() => (tabBarInset.value = 0))

async function fetchRandomTitle(): Promise<string | null> {
  const params = new URLSearchParams({
    action: 'query',
    list: 'random',
    rnnamespace: '0',
    rnlimit: '1',
    format: 'json',
    formatversion: '2',
    origin: '*',
  })
  try {
    const response = await fetch(`https://${lang.value}.wikipedia.org/w/api.php?${params}`)
    const data = await response.json()
    return data?.query?.random?.[0]?.title ?? null
  } catch {
    return null
  }
}

/** Special pages the prototype renders itself (see `mobile-nav.wiki.[title]`). */
const IN_PROTOTYPE_SPECIAL_PAGES = new Set(['nearby'])

async function onClick(item: TabItem): Promise<void> {
  if (item.destination === null) {
    if (route.path !== HOME_PATH) void router.push(HOME_PATH)
    return
  }
  const destination = normalizeTitle(item.destination)
  const special = destination.match(/^Special:(.+)$/i)?.[1].toLowerCase()
  if (special === 'search') {
    searchOpen.value = true
  } else if (special && IN_PROTOTYPE_SPECIAL_PAGES.has(special)) {
    if (!item.selected) void router.push(homeArticleLocation(destination))
  } else if (special === 'random' || special === 'randompage') {
    const title = await fetchRandomTitle()
    if (title) void router.push(homeArticleLocation(title))
  } else if (special) {
    const slug = encodeURIComponent(destination.replace(/ /g, '_'))
    requestLeave(`https://${lang.value}.m.wikipedia.org/wiki/${slug}`)
  } else if (!item.selected) {
    void router.push(homeArticleLocation(destination))
  }
}
</script>

<template>
  <!-- In-flow spacer reserving the bar's height so the footer is never covered. -->
  <div class="home-tab-bar">
    <nav
      class="home-tab-bar__bar"
      :class="{ 'home-tab-bar__bar--hidden': hidden }"
      aria-label="Tab bar"
    >
      <CdxButton
        v-for="item in items"
        :key="item.id"
        class="home-tab-bar__item"
        :class="{ 'home-tab-bar__item--selected': item.selected }"
        weight="quiet"
        :action="item.selected ? 'progressive' : 'default'"
        :aria-label="item.label"
        :aria-current="item.selected ? 'page' : undefined"
        @click="onClick(item)"
      >
        <CdxIcon :icon="item.icon" />
      </CdxButton>
    </nav>
    <MobileSearchOverlay v-if="searchOpen" :lang="lang" @close="searchOpen = false" />
  </div>
</template>

<style scoped>
.home-tab-bar {
  --home-tab-bar-height: 56px;
  height: var(--home-tab-bar-height);
  flex-shrink: 0;
}

.home-tab-bar__bar {
  position: fixed;
  inset-inline: 0;
  bottom: 0;
  z-index: var(--z-index-fixed, 200);
  display: flex;
  box-sizing: border-box;
  height: var(--home-tab-bar-height);
  /* Minerva's header grey, so the bar reads as part of the chrome. */
  background-color: var(--background-color-interactive, #eaecf0);
  box-shadow: var(--box-shadow-small-top);
  transition: transform var(--transition-duration-medium, 250ms)
    var(--transition-timing-function-system, ease);
}

/* Slide fully out, shadow included. */
.home-tab-bar__bar--hidden {
  transform: translateY(calc(100% + 4px));
}

@media (prefers-reduced-motion: reduce) {
  .home-tab-bar__bar {
    transition: none;
  }
}

/* CODEX+ Button: no tab-bar item — square, full-height, equal-width quiet buttons. */
.home-tab-bar__item.cdx-button {
  position: relative;
  flex: 1 1 0;
  min-width: 0;
  max-width: none;
  height: 100%;
  min-height: 0;
  padding: 0;
  border: 0;
  border-radius: 0;
}

/* CODEX+ Button: hover sticks after a tap on touch screens; keep the bar flat there. */
@media (hover: none) {
  .home-tab-bar__item.cdx-button:hover {
    background-color: transparent;
  }
}

/* Selected indicator as a pseudo-element: immune to Codex focus/hover border rules, no layout shift. */
.home-tab-bar__item--selected.cdx-button::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: var(--border-width-thick, 2px);
  background-color: var(--color-progressive, #36c);
}
</style>
