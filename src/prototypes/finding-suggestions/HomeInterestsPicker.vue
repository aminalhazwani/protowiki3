<script setup lang="ts">
/**
 * Picking interests (home2's onboarding step 3): the lookup, and articles
 * below that add one with a tap — related to the latest interest, or random
 * while there are none. Account setup's last step and "Select interests" both
 * use it.
 */
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { CdxCard, CdxField, CdxProgressBar } from '@wikimedia/codex'

import HomeInterestsLookup from './HomeInterestsLookup.vue'
import { loadInterestSuggestions, type InterestSuggestions } from './loadInterestSuggestions'
import { MAX_INTERESTS } from './useFindingSuggestions'
import { titleKey } from './useHomeSeeds'

/** Suggestions follow the interests a beat after they change. */
const DEBOUNCE_MS = 300

const interests = defineModel<string[]>({ required: true })

const suggestions = ref<InterestSuggestions | null>(null)
const loading = ref(true)
let controller: AbortController | null = null
let timer: ReturnType<typeof setTimeout> | undefined

async function load(titles: string[]): Promise<void> {
  controller?.abort()
  controller = new AbortController()
  const { signal } = controller
  try {
    suggestions.value = await loadInterestSuggestions(titles, signal)
  } catch (error) {
    if (signal.aborted) return
    console.warn('[Finding suggestions] interest suggestions failed to load', error)
    suggestions.value = null
  }
  loading.value = false
}

watch(
  interests,
  (titles) => {
    loading.value = true
    clearTimeout(timer)
    timer = setTimeout(() => void load([...titles]), DEBOUNCE_MS)
  },
  { immediate: true },
)

/* Follows the interests themselves, not the last load (home2). */
const heading = computed(() => (interests.value.length ? 'Related articles' : 'Random articles'))

/** Suggestions not already picked. */
const visible = computed(() => {
  const picked = new Set(interests.value.map(titleKey))
  return (suggestions.value?.hits ?? []).filter((hit) => !picked.has(titleKey(hit.title)))
})

function add(title: string): void {
  if (interests.value.length >= MAX_INTERESTS) return
  if (interests.value.some((picked) => titleKey(picked) === titleKey(title))) return
  interests.value = [...interests.value, title]
}

onBeforeUnmount(() => {
  controller?.abort()
  clearTimeout(timer)
})
</script>

<template>
  <div class="home-interests-picker">
    <CdxField hide-label>
      <template #label>Your interests</template>
      <HomeInterestsLookup v-model="interests" />
    </CdxField>

    <section v-if="loading || visible.length" class="home-interests-picker__suggestions">
      <h2 class="home-interests-picker__heading">{{ heading }}</h2>
      <CdxProgressBar v-if="loading" inline :aria-label="`Loading ${heading.toLowerCase()}`" />
      <ul v-else class="home-interests-picker__list">
        <li v-for="hit in visible" :key="hit.title">
          <!--
            A stock CdxCard; `url` makes it a link, so hover and focus come
            from Codex. The navigation is prevented and the tap adds the
            article. `force-thumbnail` keeps the image slot for articles
            without one.
          -->
          <CdxCard
            class="home-interests-picker__card"
            url="#"
            force-thumbnail
            :thumbnail="hit.thumbnailUrl ? { url: hit.thumbnailUrl } : null"
            :aria-label="`Add ${hit.title}`"
            @click.prevent="add(hit.title)"
          >
            <template #title>{{ hit.title }}</template>
          </CdxCard>
        </li>
      </ul>
    </section>
  </div>
</template>

<style scoped>
/* home2's step body: its blocks 24px apart. */
.home-interests-picker {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-150);
}

.home-interests-picker__suggestions {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-50);
}

/* A plain label-sized heading, not the skin's article `h2` (serif, rule). */
.home-interests-picker__heading {
  margin: 0;
  padding: 0;
  border: 0;
  font-family: inherit;
  font-size: var(--font-size-medium);
  font-weight: var(--font-weight-bold);
  line-height: var(--line-height-small);
  color: var(--color-subtle);
}

.home-interests-picker__list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-50);
  margin: 0;
  padding: 0;
  list-style: none;
}

/* The page's list styles add a 4px margin round each item; the gap spaces them here. */
.home-interests-picker__list > li {
  margin-block: 0;
}

.home-interests-picker__card {
  width: 100%;
}
</style>
