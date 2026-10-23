<script setup lang="ts">
/**
 * An article opened from inside the Home prototype — `/home/wiki/<Title>`,
 * mirroring Wikipedia's `/wiki/<Title>`. Links keep the reader in the prototype.
 */
import { computed, watch } from 'vue'
import { useRoute } from 'vue-router'

import ArticleLive from '@/components/article/ArticleLive.vue'

import HomeChrome from '../home/HomeChrome.vue'
import { titleFromRouteParam } from '../home/routes'
import { scrollToFragment, useHomeArticleLinks } from '../home/useHomeArticleLinks'
import { useHomeSaved } from '../home/useHomeSaved'

const route = useRoute()
const title = computed(() =>
  titleFromRouteParam((route.params as { title?: string | string[] }).title),
)

const { onArticleClick } = useHomeArticleLinks(() => title.value)
const { isSaved, toggleSaved } = useHomeSaved()

// PROTOWIKI+ Router: no `scrollBehavior`, so new pages keep the old scroll position and ignore `#hash`.
watch(title, () => window.scrollTo(0, 0), { immediate: true })

function onParserReady(): void {
  if (route.hash) scrollToFragment(route.hash.slice(1))
}
</script>

<template>
  <HomeChrome floating-home>
    <div @click="onArticleClick">
      <ArticleLive
        :article="title"
        :saved="isSaved(title)"
        @save-click="toggleSaved(title)"
        @parser-ready="onParserReady"
      />
    </div>
  </HomeChrome>
</template>
