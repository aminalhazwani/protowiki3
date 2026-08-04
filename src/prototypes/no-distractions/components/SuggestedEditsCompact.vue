<script setup lang="ts">
import { computed } from 'vue'
import { CdxIcon, CdxMessage, CdxProgressBar } from '@wikimedia/codex'
import { cdxIconArrowNext } from '@wikimedia/codex-icons'

import SuggestionCard from './SuggestionCard.vue'
import type { Suggestion } from '../data/useSuggestions'

/**
 * Compact "Suggested edits" card: header + up to three preview cards + a blue
 * "View all" strip; the whole card is one tap target. Kept in the repo as an
 * alternative to SuggestedEditsModule (the GrowthExperiments-style single
 * preview). Drive it with the shared useSuggestions() state.
 */
const props = defineProps<{
  suggestions: Suggestion[]
  loading: boolean
  error: string | null
  count: number
}>()

const emit = defineEmits<{ openAll: [] }>()

const topSuggestions = computed(() => props.suggestions.slice(0, 3))
const canOpenAll = computed(() => props.suggestions.length > 0)
const viewAllLabel = computed(() =>
  props.count > 0 ? `View all ${props.count} suggestions` : 'View all suggestions',
)

function openAll(): void {
  if (!canOpenAll.value) return
  emit('openAll')
}
</script>

<template>
  <section
    class="home__module home__module--suggestions"
    :class="{ 'home__module--interactive': canOpenAll }"
    :role="canOpenAll ? 'button' : undefined"
    :tabindex="canOpenAll ? 0 : undefined"
    :aria-label="canOpenAll ? viewAllLabel : undefined"
    @click="openAll"
    @keydown.enter.prevent="openAll"
    @keydown.space.prevent="openAll"
  >
    <header class="home__module-head">
      <h2 class="home__module-title">Suggested edits</h2>
      <span v-if="canOpenAll" class="home__module-chevron" aria-hidden="true">
        <CdxIcon :icon="cdxIconArrowNext" />
      </span>
    </header>

    <CdxProgressBar v-if="loading && !suggestions.length" inline aria-label="Loading suggestions" />

    <CdxMessage v-else-if="error" type="error" :allow-user-dismiss="false">
      {{ error }}
    </CdxMessage>

    <p v-else-if="!suggestions.length" class="home__empty">
      No suggestions yet — add an interest to get started.
    </p>

    <div v-else class="home__cards">
      <SuggestionCard
        v-for="suggestion in topSuggestions"
        :key="suggestion.title"
        :task-heading="suggestion.taskHeading"
        :task-color="suggestion.taskColor"
        :article-title="suggestion.title"
        :article-description="suggestion.description"
        :task-description="suggestion.taskDescription"
        :thumbnail-src="suggestion.thumbnailSrc"
      />
    </div>

    <div v-if="suggestions.length" class="home__view-all" aria-hidden="true">
      {{ viewAllLabel }}
    </div>
  </section>
</template>

<style scoped>
.home__module {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-100, 16px);
  border: var(--border-width-base, 1px) solid var(--border-color-subtle, #c8ccd1);
  border-radius: var(--border-radius-base, 2px);
  padding: var(--spacing-100, 16px);
}

.home__module-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-height: 2rem;
}

.home__module-title {
  margin: 0;
  font-family:
    var(--font-family-system-sans, system-ui, sans-serif), var(--font-family-base, sans-serif);
  font-size: var(--font-size-large, 1.125rem);
  font-weight: var(--font-weight-bold);
  line-height: var(--line-height-large, 1.56);
  color: var(--color-base);
}

.home__module--interactive {
  cursor: pointer;
}

.home__module--interactive:focus-visible {
  outline: 2px solid var(--color-progressive, #36c);
  outline-offset: 2px;
}

.home__module-chevron {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 2rem;
  height: 2rem;
  color: var(--color-base);
}

.home__module-chevron :deep(.cdx-icon) {
  width: 1.25rem;
  height: 1.25rem;
}

.home__cards {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-75, 12px);
}

.home__view-all {
  display: flex;
  align-items: center;
  justify-content: center;
  box-sizing: border-box;
  width: 100%;
  min-height: 2.75rem;
  padding: var(--spacing-75, 12px) var(--spacing-100, 16px);
  border-radius: var(--border-radius-base, 2px);
  background-color: var(--background-color-progressive, #36c);
  font-size: var(--font-size-medium, 1rem);
  font-weight: var(--font-weight-bold);
  line-height: var(--line-height-small, 1.375);
  color: var(--color-inverted, #fff);
  text-align: center;
}

.home__empty {
  margin: 0;
  color: var(--color-subtle);
}
</style>
