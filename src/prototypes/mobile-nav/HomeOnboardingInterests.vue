<script setup lang="ts">
/**
 * Onboarding step 3 (home2): "What are 3 of your interests?" The lookup edits
 * the reader's Personalization interests directly (so the Home behind reloads
 * to match), and suggestions below add one with a tap.
 */
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { CdxCard, CdxField, CdxMessage, CdxProgressBar } from '@wikimedia/codex'

import { MAX_INTERESTS } from './data/homeConfig'
import { loadInterestSuggestions, type InterestSuggestions } from './data/loadInterestSuggestions'
import HomeInterestsLookup from './HomeInterestsLookup.vue'
import { normalizeTitle } from './routes'
import { useHomePersonalization } from './useHomePersonalization'

/** Suggestions follow the interests a beat after they change. */
const DEBOUNCE_MS = 300

const { interests, setInterests } = useHomePersonalization()
const model = computed({ get: () => interests.value, set: setInterests })

// Once the list is full, it stays "all set" (home2).
const allSet = ref(false)
watch(
  () => interests.value.length,
  (count) => {
    if (count >= MAX_INTERESTS) allSet.value = true
  },
  { immediate: true },
)

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
    console.warn('[Home] interest suggestions failed to load', error)
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

/*
 * Follows the interests themselves, not the last load (home2): with none it's
 * "Random articles" from the first frame, and with one or more it stays
 * "Related articles" while the next suggestions load.
 */
const heading = computed(() => (interests.value.length ? 'Related articles' : 'Random articles'))

/** Suggestions not already picked. */
const visible = computed(() => {
  const picked = new Set(interests.value.map(normalizeTitle))
  return (suggestions.value?.hits ?? []).filter((hit) => !picked.has(normalizeTitle(hit.title)))
})

function add(title: string): void {
  if (interests.value.length >= MAX_INTERESTS) return
  if (interests.value.some((picked) => normalizeTitle(picked) === normalizeTitle(title))) return
  setInterests([...interests.value, title])
}

onBeforeUnmount(() => {
  controller?.abort()
  clearTimeout(timer)
})
</script>

<template>
  <section>
    <h1 class="home-onboarding-title">What are 3 of your interests?</h1>

    <div class="home-onboarding-interests__body">
      <div class="home-onboarding-interests__lookup">
        <CdxField hide-label :status="allSet ? 'success' : 'default'">
          <template #label>Your interests</template>
          <HomeInterestsLookup v-model="model" />
        </CdxField>
        <CdxMessage v-if="allSet" type="success" inline>
          All set! Your Home is personalized and ready.
        </CdxMessage>
      </div>

      <section v-if="loading || visible.length" class="home-onboarding-interests__suggestions">
        <h2 class="home-onboarding-interests__heading">{{ heading }}</h2>
        <CdxProgressBar v-if="loading" inline :aria-label="`Loading ${heading.toLowerCase()}`" />
        <ul v-else class="home-onboarding-interests__list">
          <li v-for="hit in visible" :key="hit.title">
            <!--
              A stock CdxCard; `url` makes it a link, so hover and focus come
              from Codex. The navigation is prevented and the tap adds the
              article. `force-thumbnail` keeps the image slot for articles
              without one.
            -->
            <CdxCard
              class="home-onboarding-interests__card"
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
  </section>
</template>

<style scoped>
/* home2's step body: 12px under the title, its blocks 24px apart. */
.home-onboarding-interests__body {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-150);
  padding-top: var(--spacing-75);
}

.home-onboarding-interests__lookup {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-25);
}

.home-onboarding-interests__suggestions {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-50);
}

/* A plain label-sized heading, not the skin's article `h2` (serif, rule). */
.home-onboarding-interests__heading {
  margin: 0;
  padding: 0;
  border: 0;
  font-family: inherit;
  font-size: var(--font-size-medium);
  font-weight: var(--font-weight-bold);
  line-height: var(--line-height-small);
  color: var(--color-subtle);
}

.home-onboarding-interests__list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-50);
  margin: 0;
  padding: 0;
  list-style: none;
}

/* The page's list styles add a 4px margin round each item; the gap spaces them here. */
.home-onboarding-interests__list > li {
  margin-block: 0;
}

.home-onboarding-interests__card {
  width: 100%;
}
</style>
