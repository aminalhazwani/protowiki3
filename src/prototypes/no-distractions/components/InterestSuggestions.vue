<script setup lang="ts">
import { computed } from 'vue'
import { CdxButton, CdxIcon, CdxProgressBar } from '@wikimedia/codex'
import { cdxIconAdd } from '@wikimedia/codex-icons'

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

defineEmits<{
  add: [title: string]
}>()
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
        <!-- Stock Codex button: the neutral (default) weight matches the old
             chip's subtle fill, and `size="large"` keeps the 44px touch target.
             The label carries the accessible name via aria-label so it reads as
             "Add <title>" rather than just the title. -->
        <CdxButton
          size="large"
          :disabled="disabled"
          :aria-label="`Add ${hit.title}`"
          @click="$emit('add', hit.title)"
        >
          {{ hit.title }}
          <CdxIcon :icon="cdxIconAdd" />
        </CdxButton>
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
</style>
