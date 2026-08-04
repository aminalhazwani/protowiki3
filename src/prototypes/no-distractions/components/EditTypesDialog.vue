<script setup lang="ts">
import { computed } from 'vue'
import { CdxCheckbox, CdxField } from '@wikimedia/codex'

import DialogShell from './DialogShell.vue'
import {
  DIFFICULTY_LABELS,
  EDIT_TYPE_DIALOG_OPTIONS,
  type EditTypeDialogOption,
  type TaskDifficulty,
} from '../data/microtaskCatalog'
import { useSuggestionFilters } from '../data/useSuggestionFilters'

const open = defineModel<boolean>('open', { default: false })

const { enabled } = useSuggestionFilters()

const groups = computed<
  { difficulty: TaskDifficulty; label: string; options: EditTypeDialogOption[] }[]
>(() =>
  (['easy', 'medium', 'hard'] as const)
    .map((difficulty) => ({
      difficulty,
      label: DIFFICULTY_LABELS[difficulty],
      options: EDIT_TYPE_DIALOG_OPTIONS.filter((option) => option.difficulty === difficulty),
    }))
    .filter((group) => group.options.length > 0),
)

function close(): void {
  open.value = false
}
</script>

<template>
  <DialogShell v-if="open" title="Select types of edits" @close="close" @done="close">
    <div class="edit-types-dialog">
      <p class="edit-types-dialog__intro">
        Suggested edits are designed to help you learn to edit and become more skilled as you work
        on larger types of edits.
      </p>

      <CdxField
        v-for="group in groups"
        :key="group.difficulty"
        is-fieldset
        :class="`edit-types-dialog__group--${group.difficulty}`"
      >
        <template #label>{{ group.label }}</template>
        <CdxCheckbox
          v-for="option in group.options"
          :key="option.heading"
          v-model="enabled"
          :input-value="option.heading"
        >
          {{ option.label }}
          <template v-if="option.subtitle" #description>{{ option.subtitle }}</template>
        </CdxCheckbox>
      </CdxField>
    </div>
  </DialogShell>
</template>

<style scoped>
.edit-types-dialog {
  display: flex;
  flex-direction: column;
  padding: var(--spacing-100, 16px);
}

.edit-types-dialog__intro {
  margin: 0;
  font-size: var(--font-size-medium, 1rem);
  line-height: var(--line-height-medium, 1.375);
}

.edit-types-dialog__group--easy :deep(legend .cdx-label__label__text) {
  color: var(--color-success, #14866d);
}

.edit-types-dialog__group--medium :deep(legend .cdx-label__label__text) {
  color: var(--color-warning, #a66200);
}

.edit-types-dialog__group--hard :deep(legend .cdx-label__label__text) {
  color: var(--color-error, #bf3c2c);
}
</style>
