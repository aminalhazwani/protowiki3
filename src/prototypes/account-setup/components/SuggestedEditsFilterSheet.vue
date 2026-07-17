<script setup lang="ts">
import { computed } from 'vue'
import { CdxCheckbox, CdxField, CdxPopover } from '@wikimedia/codex'

import {
  SUGGESTION_FILTER_OPTIONS,
  type SuggestionFilterOption,
  type TaskDifficulty,
} from '../data/microtaskCatalog'
import { useSuggestionFilters } from '../data/useSuggestionFilters'

const open = defineModel<boolean>('open', { default: false })

const { enabled } = useSuggestionFilters()

const DIFFICULTY_LABELS: Record<TaskDifficulty, string> = {
  easy: 'Easy',
  medium: 'Medium',
  hard: 'Hard',
}

const groups = computed<
  { difficulty: TaskDifficulty; label: string; options: SuggestionFilterOption[] }[]
>(() =>
  (['easy', 'medium', 'hard'] as const)
    .map((difficulty) => ({
      difficulty,
      label: DIFFICULTY_LABELS[difficulty],
      options: SUGGESTION_FILTER_OPTIONS.filter((option) => option.difficulty === difficulty),
    }))
    .filter((group) => group.options.length > 0),
)
</script>

<template>
  <CdxPopover
    v-model:open="open"
    class="suggested-edits-filter-sheet"
    use-bottom-sheet
    title="Filters"
    :use-close-button="true"
  >
    <div class="suggested-edits-filter-sheet__groups">
      <CdxField
        v-for="group in groups"
        :key="group.difficulty"
        is-fieldset
        :class="`suggested-edits-filter-sheet__group--${group.difficulty}`"
      >
        <template #label>{{ group.label }}</template>
        <CdxCheckbox
          v-for="option in group.options"
          :key="option.heading"
          v-model="enabled"
          :input-value="option.heading"
        >
          {{ option.heading }}
          <!-- <template #description>{{ option.description }}</template> -->
        </CdxCheckbox>
      </CdxField>
    </div>
  </CdxPopover>
</template>

<style scoped>
.suggested-edits-filter-sheet__groups {
  display: flex;
  flex-direction: column;
}

.suggested-edits-filter-sheet__group--easy :deep(legend .cdx-label__label__text) {
  color: var(--color-success);
}

.suggested-edits-filter-sheet__group--medium :deep(legend .cdx-label__label__text) {
  color: var(--color-warning);
}

.suggested-edits-filter-sheet__group--hard :deep(legend .cdx-label__label__text) {
  color: var(--color-error);
}
</style>
