<script setup lang="ts">
/**
 * An article opened from inside the Home prototype — `/home/wiki/<Title>`,
 * mirroring Wikipedia's `/wiki/<Title>`. Links keep the reader in the prototype.
 * Special:Nearby is the prototype's own page (the tab bar's Nearby tab).
 */
import { computed, watch } from 'vue'
import { useRoute } from 'vue-router'

import ArticleLive from '@/components/article/ArticleLive.vue'

import HomeChrome from '../mobile-nav/HomeChrome.vue'
import HomeNearby from '../mobile-nav/HomeNearby.vue'
import { titleFromRouteParam } from '../mobile-nav/routes'
import { scrollToFragment, useHomeArticleLinks } from '../mobile-nav/useHomeArticleLinks'
import { useHomeSaved } from '../mobile-nav/useHomeSaved'

const route = useRoute()
const title = computed(() =>
  titleFromRouteParam((route.params as { title?: string | string[] }).title),
)

const isNearby = computed(() => title.value.toLowerCase() === 'special:nearby')

const { onArticleClick } = useHomeArticleLinks(() => title.value)
const { isSaved, toggleSaved } = useHomeSaved()

// PROTOWIKI+ Router: no `scrollBehavior`, so new pages keep the old scroll position and ignore `#hash`.
watch(title, () => window.scrollTo(0, 0), { immediate: true })

function onParserReady(): void {
  if (route.hash) scrollToFragment(route.hash.slice(1))
}
</script>

<template>
  <HomeChrome :last-edited-notice="!isNearby">
    <HomeNearby v-if="isNearby" />
    <div v-else @click="onArticleClick">
      <ArticleLive
        :article="title"
        :saved="isSaved(title)"
        @save-click="toggleSaved(title)"
        @parser-ready="onParserReady"
      />
    </div>
  </HomeChrome>
</template>
