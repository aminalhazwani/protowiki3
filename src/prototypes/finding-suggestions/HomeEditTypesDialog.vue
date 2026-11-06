<script setup lang="ts">
/**
 * "Select types of edits": the types of edits Suggested edits draws from, by
 * difficulty. The footer says whether the picks find suggestions as they
 * change; Done keeps them, Cancel (or ✕) drops them.
 */
import { computed, ref, watch } from 'vue'
import { CdxCheckbox, CdxField } from '@wikimedia/codex'

import { DIFFICULTY_LABELS, EDIT_TYPE_OPTIONS, type EditTypeId } from './editTypeOptions'
import HomeDialogShell from './HomeDialogShell.vue'
import HomeFindingStatus from './HomeFindingStatus.vue'
import { findsSuggestions, useFindingSuggestions } from './useFindingSuggestions'
import { useFindingStatus } from './useFindingStatus'

const { dialog, editTypes, interests, apply } = useFindingSuggestions()

const open = computed({
  get: () => dialog.value === 'edit-types',
  set: (value: boolean) => {
    if (!value) dialog.value = null
  },
})

const draft = ref<EditTypeId[]>([])

const { status, reset } = useFindingStatus(
  open,
  () => [...draft.value].sort().join('|'),
  () => findsSuggestions(draft.value, interests.value),
)

watch(
  open,
  (isOpen) => {
    if (!isOpen) return
    draft.value = [...editTypes.value]
    reset()
  },
  { immediate: true },
)

const groups = (['easy', 'medium', 'hard'] as const).map((difficulty) => ({
  difficulty,
  label: DIFFICULTY_LABELS[difficulty],
  options: EDIT_TYPE_OPTIONS.filter((option) => option.difficulty === difficulty),
}))

function done(): void {
  apply('edit-types', { editTypes: draft.value })
  dialog.value = null
}

/* The footer's "interests": keep these picks, and go on to "Select interests". */
function toInterests(): void {
  apply('edit-types', { editTypes: draft.value }, { teach: false })
  dialog.value = 'interests'
}
</script>

<template>
  <HomeDialogShell
    v-model:open="open"
    title="Select types of edits"
    :primary-action="{ label: 'Done', actionType: 'progressive' }"
    :default-action="{ label: 'Cancel' }"
    stacked-actions
    tall
    @primary="done"
    @default="open = false"
  >
    <div class="home-edit-types-dialog">
      <CdxField v-for="group in groups" :key="group.difficulty" is-fieldset>
        <template #label>{{ group.label }}</template>
        <CdxCheckbox
          v-for="option in group.options"
          :key="option.id"
          v-model="draft"
          :input-value="option.id"
        >
          {{ option.label }}
          <template v-if="option.description" #description>{{ option.description }}</template>
        </CdxCheckbox>
      </CdxField>
    </div>

    <template #footer-text>
      <HomeFindingStatus :status="status" link="interests" @link="toInterests" />
    </template>
  </HomeDialogShell>
</template>

<style scoped>
.home-edit-types-dialog {
  display: flex;
  flex-direction: column;
}
</style>
