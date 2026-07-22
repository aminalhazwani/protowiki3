<script setup lang="ts">
import { computed } from 'vue'
import { CdxIcon } from '@wikimedia/codex'
import { cdxIconAdd } from '@wikimedia/codex-icons'

import type { MorelikeSearchHit } from '@/lib/fetchMorelike'

const props = withDefaults(
  defineProps<{
    suggestions: MorelikeSearchHit[]
    loading?: boolean
    source?: 'morelike' | 'random'
  }>(),
  { source: 'morelike' },
)

const heading = computed(() =>
  props.source === 'random' ? 'Random articles' : 'Related articles',
)

defineEmits<{
  add: [title: string]
}>()
</script>

<template>
  <section v-if="suggestions.length" class="interest-suggestions">
    <h2 class="interest-suggestions__heading">{{ heading }}</h2>
    <ul class="interest-suggestions__list">
      <li v-for="hit in suggestions" :key="hit.title">
        <button
          type="button"
          class="interest-suggestions__chip"
          :aria-label="`Add ${hit.title}`"
          @click="$emit('add', hit.title)"
        >
          <span v-if="hit.thumbnail?.url" class="interest-suggestions__thumb">
            <img :src="hit.thumbnail.url" alt="" />
          </span>
          <span class="interest-suggestions__label">{{ hit.title }}</span>
          <CdxIcon :icon="cdxIconAdd" class="interest-suggestions__add" />
        </button>
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

.interest-suggestions__list {
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-75, 12px);
  margin: 0;
  padding: 0;
  list-style: none;
}

.interest-suggestions__list li {
  margin-block: 0;
  max-width: 100%;
}

.interest-suggestions__chip {
  display: inline-flex;
  align-items: center;
  gap: var(--spacing-50, 8px);
  max-width: 100%;
  min-height: 2.75rem;
  padding: var(--spacing-25, 4px) var(--spacing-50, 8px) var(--spacing-25, 4px) 14px;
  border: var(--border-width-base, 1px) solid var(--border-color-subtle, #c8ccd1);
  border-radius: var(--border-radius-pill, 9999px);
  background-color: var(--background-color-interactive-subtle, #f8f9fa);
  font: inherit;
  text-align: start;
  cursor: pointer;
}

.interest-suggestions__chip:hover {
  background-color: var(--background-color-interactive-subtle--hover, #eaecf0);
}

.interest-suggestions__thumb {
  display: inline-flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  width: 2rem;
  height: 2rem;
  margin-left: calc(-1 * var(--spacing-50, 8px));
  border-radius: var(--border-radius-circle, 50%);
  overflow: hidden;
}

.interest-suggestions__thumb img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.interest-suggestions__label {
  min-width: 0;
  overflow: hidden;
  font-size: var(--font-size-medium, 1rem);
  line-height: var(--line-height-small, 1.375);
  color: var(--color-base);
  white-space: nowrap;
  text-overflow: ellipsis;
}

.interest-suggestions__add {
  flex-shrink: 0;
  color: var(--color-base, #404244);
}
</style>
