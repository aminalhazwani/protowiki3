<script setup lang="ts">
/**
 * "Tab bar" variant: Home · Saved · Search, fixed to the bottom of every page.
 * Home is selected on the Home; Saved is inert; Search opens Minerva's search.
 * Styles from `home-renovation`'s `HomeMobileTabBar`.
 */
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { CdxButton, CdxIcon } from '@wikimedia/codex'
import { cdxIconBookmarkList, cdxIconHome, cdxIconSearch, type Icon } from '@wikimedia/codex-icons'

import MobileSearchOverlay from '@/components/search/MobileSearchOverlay.vue'
import { useConfig } from '@/composables/useConfig'

import { HOME_NAV_HOME_PATH } from './navVariants'

interface TabItem {
  id: 'home' | 'saved' | 'search'
  icon: Icon
  label: string
}

const TABS: TabItem[] = [
  { id: 'home', icon: cdxIconHome, label: 'Home' },
  { id: 'saved', icon: cdxIconBookmarkList, label: 'Saved' },
  { id: 'search', icon: cdxIconSearch, label: 'Search' },
]

const route = useRoute()
const router = useRouter()
const { lang } = useConfig()

const searchOpen = ref(false)
const onHome = computed(() => route.path === HOME_NAV_HOME_PATH)

function isSelected(item: TabItem): boolean {
  return item.id === 'home' && onHome.value
}

function onClick(item: TabItem): void {
  if (item.id === 'home' && !onHome.value) void router.push(HOME_NAV_HOME_PATH)
  if (item.id === 'search') searchOpen.value = true
}
</script>

<template>
  <!-- In-flow spacer the bar's height, so the page's end is never covered. -->
  <div class="nav-tab-bar">
    <nav class="nav-tab-bar__bar" aria-label="Tab bar">
      <CdxButton
        v-for="item in TABS"
        :key="item.id"
        class="nav-tab-bar__item"
        :class="{ 'nav-tab-bar__item--selected': isSelected(item) }"
        weight="quiet"
        :action="isSelected(item) ? 'progressive' : 'default'"
        :aria-label="item.label"
        :aria-current="isSelected(item) ? 'page' : undefined"
        @click="onClick(item)"
      >
        <CdxIcon :icon="item.icon" />
      </CdxButton>
    </nav>
    <MobileSearchOverlay v-if="searchOpen" :lang="lang" @close="searchOpen = false" />
  </div>
</template>

<style scoped>
.nav-tab-bar {
  --nav-tab-bar-height: 56px;
  flex-shrink: 0;
  height: var(--nav-tab-bar-height);
}

.nav-tab-bar__bar {
  position: fixed;
  inset-inline: 0;
  bottom: 0;
  z-index: var(--z-index-fixed, 200);
  display: flex;
  box-sizing: border-box;
  height: var(--nav-tab-bar-height);
  border-top: var(--border-width-base) var(--border-style-base) var(--border-color-subtle);
  background-color: var(--background-color-base);
}

/* CODEX+ Button: no tab-bar item — full-height, equal-width quiet buttons. */
.nav-tab-bar__item.cdx-button {
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
  .nav-tab-bar__item.cdx-button:hover {
    background-color: transparent;
  }
}

/* Selected indicator as a pseudo-element: immune to Codex focus/hover borders, no layout shift. */
.nav-tab-bar__item--selected.cdx-button::before {
  content: '';
  position: absolute;
  top: 0;
  right: 0;
  left: 0;
  height: var(--border-width-thick, 2px);
  background-color: var(--color-progressive, #36c);
}
</style>
