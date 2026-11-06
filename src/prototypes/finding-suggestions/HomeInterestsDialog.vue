<script setup lang="ts">
/**
 * "Select interests": account setup's interests picker, on its own. The
 * footer says whether the picks find suggested edits as they change; Done
 * keeps them, Cancel (or ✕) drops them.
 */
import { computed, ref, watch } from 'vue'

import HomeDialogShell from './HomeDialogShell.vue'
import HomeFindingStatus from './HomeFindingStatus.vue'
import HomeInterestsPicker from './HomeInterestsPicker.vue'
import { findsSuggestions, MAX_INTERESTS, useFindingSuggestions } from './useFindingSuggestions'
import { useFindingStatus } from './useFindingStatus'

const { dialog, interests, editTypes, apply } = useFindingSuggestions()

const open = computed({
  get: () => dialog.value === 'interests',
  set: (value: boolean) => {
    if (!value) dialog.value = null
  },
})

const draft = ref<string[]>([])
const model = computed({
  get: () => draft.value,
  set: (titles: string[]) => {
    draft.value = titles.slice(0, MAX_INTERESTS)
  },
})

const { status, reset } = useFindingStatus(
  open,
  () => draft.value.join('\n'),
  () => findsSuggestions(editTypes.value, draft.value),
)

watch(
  open,
  (isOpen) => {
    if (!isOpen) return
    draft.value = [...interests.value]
    reset()
  },
  { immediate: true },
)

function done(): void {
  apply('interests', { interests: draft.value })
  dialog.value = null
}

/* The footer's "types of edits": keep these picks, and go on to that dialog. */
function toEditTypes(): void {
  apply('interests', { interests: draft.value }, { teach: false })
  dialog.value = 'edit-types'
}
</script>

<template>
  <HomeDialogShell
    v-model:open="open"
    title="Select interests"
    :primary-action="{ label: 'Done', actionType: 'progressive' }"
    :default-action="{ label: 'Cancel' }"
    stacked-actions
    tall
    @primary="done"
    @default="open = false"
  >
    <HomeInterestsPicker v-model="model" />

    <template #footer-text>
      <HomeFindingStatus :status="status" link="types of edits" @link="toEditTypes" />
    </template>
  </HomeDialogShell>
</template>
