<script setup lang="ts">
import { computed, onBeforeUnmount, ref } from 'vue'
import { CdxButton, CdxRadio } from '@wikimedia/codex'

import type { FlowState, SurveyChoice } from '../data/useFlowState'

const props = defineProps<{ flow: FlowState }>()

/** Hold after the selection feedback before auto-advancing (T3). Mirrors
 *  `--ob-delay-selection-hold`; kept in JS since only the timer needs it. */
const SELECTION_HOLD_MS = 400

const OPTIONS: { value: SurveyChoice; label: string; description: string }[] = [
  {
    value: 'read',
    label: 'Reading and exploring',
    description: 'Learn, save articles, play games.',
  },
  {
    value: 'edit',
    label: 'Editing and contributing',
    description: 'Fix a typo, update an article, or start a new one.',
  },
  {
    value: 'both',
    label: 'A bit of both',
    description: 'Read, save, and make a few edits too.',
  },
]

// Local echo of the tap so the selection state paints immediately, without
// waiting for the URL round-trip that `patch` performs. Falls back to the
// persisted answer (e.g. when returning via Back).
const pending = ref<SurveyChoice | ''>('')
const selected = computed(() => pending.value || props.flow.survey.value)

let advanceTimer: ReturnType<typeof setTimeout> | null = null
const advancing = ref(false)

async function choose(value: SurveyChoice): Promise<void> {
  if (advancing.value) return // ignore taps once we're committed to advancing
  advancing.value = true
  pending.value = value

  // Record the answer on the current (survey) history entry first, then advance.
  // Awaiting the replace keeps both steps distinct so back navigation restores
  // this screen with the answer still selected.
  await props.flow.patch({ survey: value })

  // Two sequential behaviours (do not combine): the selection feedback plays,
  // then a short hold lets it register before the step transition fires.
  advanceTimer = setTimeout(() => {
    void props.flow.goTo('interests')
  }, SELECTION_HOLD_MS)
}

/** CdxRadio emits the broad input-value union; narrow it back to SurveyChoice. */
function onSelect(value: string | number | boolean): void {
  void choose(value as SurveyChoice)
}

function skip(): void {
  if (advancing.value) return
  void props.flow.goTo('interests')
}

onBeforeUnmount(() => {
  if (advanceTimer) clearTimeout(advanceTimer)
})
</script>

<template>
  <div class="ob-page">
    <h1 class="ob-title">What brings you to Wikipedia?</h1>

    <div class="ob-body">
      <!-- Each option is a selectable card wrapping a Codex radio; the whole
           card is a hit target, while the radio keeps native keyboard/aria
           semantics. `role="radiogroup"` groups them for assistive tech. -->
      <div class="survey__options" role="radiogroup" aria-label="What brings you to Wikipedia?">
        <div
          v-for="option in OPTIONS"
          :key="option.value"
          class="survey__option"
          :class="{ 'survey__option--selected': selected === option.value }"
          @click="choose(option.value)"
        >
          <CdxRadio
            :model-value="selected"
            :input-value="option.value"
            name="survey-motivation"
            @update:model-value="onSelect"
          >
            {{ option.label }}
            <template #description>{{ option.description }}</template>
          </CdxRadio>
        </div>
      </div>

      <div class="ob-actions">
        <CdxButton weight="quiet" @click="skip">Skip</CdxButton>
      </div>
    </div>
  </div>
</template>

<style scoped>
.survey__options {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-75, 12px);
}

.survey__option {
  padding: var(--spacing-100, 16px);
  border: var(--border-width-base, 1px) solid var(--border-color-base, #a2a9b1);
  border-radius: var(--border-radius-base, 2px);
  background-color: var(--background-color-base);
  cursor: pointer;
  /* Selection is feedback — a quick color change, no movement, so it stays put
     under reduced motion (movement is what that setting drops, not color). */
  transition:
    border-color var(--ob-duration-selection, 140ms) ease,
    background-color var(--ob-duration-selection, 140ms) ease;
}

.survey__option--selected {
  border-color: var(--color-progressive, #36c);
  background-color: var(--background-color-progressive-subtle, #e8eeff);
}

/* The card already provides the padding and hit target, so drop the radio's
   own outer margin and let it fill the card width. */
.survey__option :deep(.cdx-radio) {
  margin: 0;
}
</style>
