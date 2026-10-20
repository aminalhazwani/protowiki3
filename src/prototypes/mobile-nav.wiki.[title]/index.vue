<script setup lang="ts">
/**
 * An article opened from inside the Home prototype — `/home/wiki/<Title>`,
 * mirroring Wikipedia's `/wiki/<Title>`. Links keep the reader in the prototype.
 * The Main Page too, once signed in (the wordmark leads here; see `MAIN_PAGE_PATH`).
 * Special:Nearby and Special:ReadingLists are the prototype's own pages (the
 * tab bar's Nearby and Reading lists tabs).
 */
import { computed } from 'vue'
import { useRoute } from 'vue-router'

import ArticleLive from '@/components/article/ArticleLive.vue'
import { useConfig } from '@/composables/useConfig'

import HomeChrome from '../mobile-nav/HomeChrome.vue'
import HomeNearby from '../mobile-nav/HomeNearby.vue'
import HomeSavedPages from '../mobile-nav/HomeSavedPages.vue'
import { MAIN_PAGE_TITLE, titleFromRouteParam } from '../mobile-nav/routes'
import { scrollToFragment, useHomeArticleLinks } from '../mobile-nav/useHomeArticleLinks'
import { useHomeAccount } from '../mobile-nav/useHomeAccount'
import { useHomeSaved } from '../mobile-nav/useHomeSaved'

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

// Scroll position: `useHomeScroll` (each page its own; `#hash` is handled below).

function onParserReady(): void {
  if (route.hash) scrollToFragment(route.hash.slice(1))
}
</script>

<template>
  <HomeChrome :last-edited-notice="!isSpecialPage">
    <HomeNearby v-if="isNearby" />
    <HomeSavedPages v-else-if="isReadingLists" />
    <div v-else @click="onArticleClick">
      <ArticleLive
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
