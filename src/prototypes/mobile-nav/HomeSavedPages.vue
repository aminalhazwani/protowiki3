<script setup lang="ts">
/**
 * The prototype's Special:ReadingLists: the reader's saved pages as a page of
 * its own (wiki header and footer), not the Saved module's drill-down. Same
 * cards and data as the module; the bookmark unsaves, and the list follows.
 */
import { onBeforeUnmount, ref, watch } from 'vue'
import { cdxIconBookmark } from '@wikimedia/codex-icons'

import { loadSaved } from './data/loadSaved'
import type { HomeCardData } from './data/types'
import HomeCard from './HomeCard.vue'
import HomePage from './HomePage.vue'
import { useHomeSaved } from './useHomeSaved'

const { savedTitles } = useHomeSaved()

const cards = ref<HomeCardData[] | null>(null)
let controller: AbortController | undefined

async function load(): Promise<void> {
  controller?.abort()
  controller = new AbortController()
  const { signal } = controller
  const loaded = await loadSaved(signal).catch(() => null)
  if (!signal.aborted) cards.value = loaded ?? []
}

watch(() => savedTitles.value.join('|'), load, { immediate: true })
onBeforeUnmount(() => controller?.abort())
</script>

<template>
  <HomePage title="Saved pages">
    <div v-if="cards === null" class="home-saved-pages__list">
      <HomeCard v-for="n in Math.min(savedTitles.length, 3) || 1" :key="n" variant="article" loading />
    </div>
    <p v-else-if="!cards.length" class="home-saved-pages__empty">Nothing here right now.</p>
    <div v-else class="home-saved-pages__list">
      <HomeCard
        v-for="card in cards"
        :key="card.key"
        variant="article"
        :card="card"
        :supporting-icon="cdxIconBookmark"
        saveable
      />
    </div>
  </HomePage>
</template>

<style scoped>
.home-saved-pages__list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-50);
}

.home-saved-pages__empty {
  margin: 0;
  color: var(--color-subtle);
}
</style>
