<script setup lang="ts">
/**
 * An article opened from inside the Home prototype — `/home/wiki/<Title>`,
 * mirroring Wikipedia's `/wiki/<Title>`. Links keep the reader in the prototype.
 * The Main Page too, once signed in (the wordmark leads here; see `MAIN_PAGE_PATH`).
 * Special:Nearby and Special:ReadingLists are the prototype's own pages (the
 * tab bar's Nearby and Reading lists tabs).
 */
import { computed, ref, watch } from 'vue'
import { useRoute } from 'vue-router'

import ArticleLive from '@/components/article/ArticleLive.vue'
import { useConfig } from '@/composables/useConfig'

import HomeChrome from '../mobile-nav/HomeChrome.vue'
import HomeMinminArticle from '../mobile-nav/HomeMinminArticle.vue'
import HomeNearby from '../mobile-nav/HomeNearby.vue'
import HomeSavedPages from '../mobile-nav/HomeSavedPages.vue'
import { MAIN_PAGE_TITLE, titleFromRouteParam } from '../mobile-nav/routes'
import { scrollToFragment, useHomeArticleLinks } from '../mobile-nav/useHomeArticleLinks'
import { useHomeAccount } from '../mobile-nav/useHomeAccount'
import { useHomeSaved } from '../mobile-nav/useHomeSaved'
import { useHomeSkin } from '../mobile-nav/useHomeSkin'

const route = useRoute()
const title = computed(() =>
  titleFromRouteParam((route.params as { title?: string | string[] }).title),
)

const isMainPage = computed(() => title.value === MAIN_PAGE_TITLE)

/* Signed in, Minerva's Main Page greets the reader by name (shown on mobile only). */
const { isLoggedIn } = useHomeAccount()
const { displayName } = useConfig()
const mainPageGreeting = computed(() =>
  isMainPage.value && isLoggedIn.value ? `Welcome, ${displayName.value}!` : undefined,
)
const isNearby = computed(() => title.value.toLowerCase() === 'special:nearby')
const isReadingLists = computed(() => title.value.toLowerCase() === 'special:readinglists')
const isSpecialPage = computed(() => isNearby.value || isReadingLists.value)

const { onArticleClick } = useHomeArticleLinks(() => title.value)
const { isSaved, toggleSaved } = useHomeSaved()

/* Minmin (Prototype settings → Skin) brings its own article top; the Main Page keeps Minerva's. */
const { isMinmin } = useHomeSkin()
const showMinmin = computed(() => isMinmin.value && !isMainPage.value)
const parserRoot = ref<HTMLElement | null>(null)
/*
 * Minmin edits the parsed body in place (lead fade, closed sections), so a skin
 * switch renders the article afresh rather than undoing that; the body comes
 * from cache.
 */
watch([title, showMinmin], () => (parserRoot.value = null))

// Scroll position: `useHomeScroll` (each page its own; `#hash` is handled below).

function onParserReady(root: HTMLElement): void {
  parserRoot.value = root
  // Minmin closes the article up first; it says when (`bodyReady`).
  if (!showMinmin.value) scrollToHash()
}

function scrollToHash(): void {
  if (route.hash) scrollToFragment(route.hash.slice(1))
}
</script>

<template>
  <HomeChrome :last-edited-notice="!isSpecialPage">
    <HomeNearby v-if="isNearby" />
    <HomeSavedPages v-else-if="isReadingLists" />
    <div v-else :class="{ 'home-wiki--minmin': showMinmin }" @click="onArticleClick">
      <HomeMinminArticle
        v-if="showMinmin"
        :key="title"
        :title="title"
        :root="parserRoot"
        :saved="isSaved(title)"
        @save-click="toggleSaved(title)"
        @body-ready="scrollToHash"
      />
      <ArticleLive
        :key="showMinmin ? 'minmin' : 'minerva'"
        :article="title"
        :main-page="isMainPage"
        :main-page-greeting="mainPageGreeting"
        :persist-cache="!isMainPage"
        :saved="isSaved(title)"
        @save-click="toggleSaved(title)"
        @parser-ready="onParserReady"
      />
    </div>
  </HomeChrome>
</template>

<style scoped>
/* PROTOWIKI+ (mobile-nav) ArticleWrapper: Minmin replaces Minerva's article header with its own (`HomeMinminArticle`). */
.home-wiki--minmin :deep(.article-header) {
  display: none;
}

/* PROTOWIKI+ (mobile-nav) ArticleRenderer: in Minmin a section's edit pencil shows only while it's open (hidden, not removed, so the heading keeps its height). */
.home-wiki--minmin :deep(.protowiki-mobile-h2--collapsed .protowiki-mobile-h2__edit) {
  visibility: hidden;
}

.home-wiki--minmin :deep(.article) {
  padding-block-start: var(--spacing-100);
}
</style>
