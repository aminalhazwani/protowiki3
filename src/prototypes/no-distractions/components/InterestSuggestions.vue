<script setup lang="ts">
import { computed } from 'vue'
import { CdxCard, CdxProgressBar } from '@wikimedia/codex'

import type { MorelikeSearchHit } from '@/lib/fetchMorelike'

const props = withDefaults(
  defineProps<{
    suggestions: MorelikeSearchHit[]
    loading?: boolean
    source?: 'morelike' | 'random'
    disabled?: boolean
  }>(),
  { source: 'morelike', disabled: false },
)

const heading = computed(() =>
  props.source === 'random' ? 'Random articles' : 'Related articles',
)

const emit = defineEmits<{
  add: [title: string]
}>()

function onAdd(title: string): void {
  if (props.disabled) return
  emit('add', title)
}
</script>

<template>
  <section v-if="loading || suggestions.length" class="interest-suggestions">
    <h2 class="interest-suggestions__heading">{{ heading }}</h2>
    <CdxProgressBar
      v-if="loading"
      class="interest-suggestions__progress"
      inline
      :aria-label="`Loading ${heading.toLowerCase()}`"
    />
    <ul v-else class="interest-suggestions__list">
      <li v-for="hit in suggestions" :key="hit.title">
        <!-- Stock Codex Card. Setting `url` is what makes a Card clickable, so
             it renders as a link with Codex's hover/active affordances; we
             prevent the navigation and emit `add` instead, adding the article
             to the lookup's chips. `force-thumbnail` keeps a consistent image
             slot (placeholder icon) for articles without a thumbnail. The
             aria-label makes it read as "Add <title>" rather than just a link. -->
        <CdxCard
          class="interest-suggestions__card"
          :class="{ 'interest-suggestions__card--disabled': disabled }"
          url="#"
          force-thumbnail
          :thumbnail="hit.thumbnail ?? null"
          :aria-label="`Add ${hit.title}`"
          @click.prevent="onAdd(hit.title)"
        >
          <template #title>{{ hit.title }}</template>
        </CdxCard>
      </li>
    </ul>
  </section>
</template>

<style scoped>
.interest-suggestions {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-50, 8px);
}

.interest-suggestions__heading {
  margin: var(--spacing-75, 12px) 0 0 0;
  font-family: inherit;
  font-size: var(--font-size-medium, 1rem);
  font-weight: var(--font-weight-bold, 700);
  line-height: var(--line-height-small, 1.375);
  color: var(--color-subtle, #54595d);
}

.interest-suggestions__progress {
  margin-top: var(--spacing-25, 4px);
}

.interest-suggestions__list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-50, 8px);
  margin: 0;
  padding: 0;
  list-style: none;
}

.interest-suggestions__list li {
  margin-block: 0;
  max-width: 100%;
}

.interest-suggestions__card {
  width: 100%;
}

/* At the cap the suggestions are frozen: grey them out and drop pointer events
   so they read as inactive (onAdd also guards the click). */
.interest-suggestions__card--disabled {
  pointer-events: none;
  opacity: 0.5;
}
</style>
