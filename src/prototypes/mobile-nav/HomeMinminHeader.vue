<script setup lang="ts">
/**
 * Minmin's header: ☰, the wordmark and the account menu in the bar, and the
 * search field always showing under it (Minerva keeps search behind an icon).
 * The field is the real typeahead search, right there in the page.
 */
import { markRaw, ref } from 'vue'
import type { RouteLocationRaw } from 'vue-router'

import Search from '@/components/Search.vue'
import ChromeHeader from '@/components/chrome/ChromeHeader.vue'
import MinervaUserMenu from '@/components/chrome/MinervaUserMenu.vue'
import type { HeaderItem } from '@/components/header/headerItems'

import { useHomeMinminSearch } from './useHomeMinminSearch'

defineProps<{ brandTo: RouteLocationRaw }>()

/** Just the account menu: search moves under the bar, notifications go. */
const RIGHT: HeaderItem[] = [{ type: 'component', component: markRaw(MinervaUserMenu) }]

// The tab bar's Search tab focuses this field instead of opening Minerva's overlay.
const searchField = ref<HTMLElement | null>(null)
useHomeMinminSearch().register(searchField)
</script>

<template>
  <div class="home-minmin-header">
    <ChromeHeader skin="mobile" :brand-to="brandTo" :right="RIGHT">
      <template #menu>
        <slot name="menu" />
      </template>
    </ChromeHeader>
    <div ref="searchField" class="home-minmin-header__search">
      <Search placeholder="Search" />
    </div>
  </div>
</template>

<style scoped>
/*
 * PROTOWIKI+ (mobile-nav) MinervaChromeHeader: Minmin's bar is the page's own
 * white, with no shadow or rule, and the wordmark centred at full strength.
 */
.home-minmin-header :deep(.minerva-chrome-header) {
  border-bottom: 0;
}

.home-minmin-header :deep(.minerva-chrome-header__nav) {
  background-color: var(--background-color-base);
  box-shadow: none;
}

/*
 * PROTOWIKI+ (mobile-nav) MinervaChromeHeader: ☰ and the account button at
 * Codex's default size, in the article's 16px gutter on both sides — so the
 * account button lines up over the title's edit and ⋮ buttons.
 */
.home-minmin-header :deep(.minerva-chrome-header__nav) {
  padding-inline: var(--spacing-100);
}

.home-minmin-header :deep(.minerva-chrome-header__nav .minerva-chrome-header__left .cdx-button),
.home-minmin-header :deep(.minerva-chrome-header__nav .minerva-chrome-header__right .cdx-button) {
  width: var(--min-size-interactive-pointer);
  min-width: var(--min-size-interactive-pointer);
  max-width: var(--min-size-interactive-pointer);
  height: var(--min-size-interactive-pointer);
  min-height: var(--min-size-interactive-pointer);
}

.home-minmin-header :deep(.minerva-chrome-header__middle) {
  flex: 1;
  max-width: none;
  justify-content: center;
}

.home-minmin-header :deep(.minerva-chrome-header__wordmark-img) {
  opacity: 1;
}

.home-minmin-header__search {
  padding: var(--spacing-25) var(--spacing-100) var(--spacing-50);
}

/*
 * CODEX+ CdxTypeaheadSearch: `show-thumbnail` pushes the icon right to centre it
 * over the results' thumbnails, and only `is-mobile-view` turns that off — which
 * hides the icon too. Back to a plain text input's icon spacing.
 */
.home-minmin-header__search :deep(.cdx-typeahead-search--show-thumbnail .cdx-search-input .cdx-text-input__input) {
  padding-left: calc(var(--spacing-50) * 2 + var(--size-icon-medium));
}

.home-minmin-header__search :deep(.cdx-typeahead-search--show-thumbnail .cdx-search-input .cdx-text-input__start-icon) {
  left: calc(var(--spacing-50) + var(--border-width-base));
}
</style>
