<script setup lang="ts">
/**
 * Minmin's header: ☰, the wordmark and the account menu in the bar, and the
 * search field always showing under it (Minerva keeps search behind an icon).
 * The field opens Minerva's full-screen search.
 */
import { markRaw, ref } from 'vue'
import type { RouteLocationRaw } from 'vue-router'
import { CdxTextInput } from '@wikimedia/codex'
import { cdxIconSearch } from '@wikimedia/codex-icons'

import ChromeHeader from '@/components/chrome/ChromeHeader.vue'
import MinervaUserMenu from '@/components/chrome/MinervaUserMenu.vue'
import type { HeaderItem } from '@/components/header/headerItems'
import MobileSearchOverlay from '@/components/search/MobileSearchOverlay.vue'

defineProps<{ brandTo: RouteLocationRaw }>()

/** Just the account menu: search moves under the bar, notifications go. */
const RIGHT: HeaderItem[] = [{ type: 'component', component: markRaw(MinervaUserMenu) }]

const searchOpen = ref(false)
</script>

<template>
  <div class="home-minmin-header">
    <ChromeHeader skin="mobile" :brand-to="brandTo" :right="RIGHT">
      <template #menu>
        <slot name="menu" />
      </template>
    </ChromeHeader>
    <div class="home-minmin-header__search">
      <CdxTextInput
        :start-icon="cdxIconSearch"
        placeholder="Search"
        aria-label="Search Wikipedia"
        readonly
        @click="searchOpen = true"
        @keydown.enter="searchOpen = true"
      />
    </div>
    <MobileSearchOverlay v-if="searchOpen" @close="searchOpen = false" />
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

/* CODEX+ CdxTextInput: readonly greys the field; this one only opens search, so it keeps the editable look. */
.home-minmin-header__search :deep(.cdx-text-input__input) {
  background-color: var(--background-color-base);
  cursor: pointer;
}
</style>
