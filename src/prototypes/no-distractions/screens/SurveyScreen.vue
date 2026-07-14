<script setup lang="ts">
import { computed, onBeforeUnmount, ref } from 'vue'
import { CdxButton, CdxIcon } from '@wikimedia/codex'
import { cdxIconSuccess } from '@wikimedia/codex-icons'

import type { FlowState, SurveyChoice } from '../data/useFlowState'

const props = defineProps<{ flow: FlowState }>()

/** Hold after the selection feedback before auto-advancing (T3). Mirrors
 *  `--ob-delay-selection-hold`; kept in JS since only the timer needs it. */
const SELECTION_HOLD_MS = 400

const OPTIONS: { value: SurveyChoice; label: string }[] = [
  { value: 'read', label: 'Reading and exploring' },
  { value: 'edit', label: 'Editing and contributing' },
  { value: 'both', label: 'A bit of both' },
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
      <div class="survey__options" role="radiogroup" aria-label="What brings you to Wikipedia?">
        <button
          v-for="option in OPTIONS"
          :key="option.value"
          type="button"
          role="radio"
          :aria-checked="selected === option.value"
          class="survey__option"
          :class="{ 'survey__option--selected': selected === option.value }"
          @click="choose(option.value)"
        >
          <span v-if="selected === option.value" class="survey__indicator">
            <CdxIcon :icon="cdxIconSuccess" />
          </span>
          <span v-else class="survey__radio" aria-hidden="true" />
          <span class="survey__label">{{ option.label }}</span>
        </button>
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
  display: flex;
  align-items: center;
  gap: var(--spacing-50, 8px);
  width: 100%;
  min-height: 2.75rem;
  padding: var(--spacing-50, 8px) var(--spacing-75, 12px);
  border: var(--border-width-base, 1px) solid var(--border-color-interactive, #72777d);
  border-radius: var(--border-radius-pill, 9999px);
  background-color: var(--background-color-base);
  text-align: start;
  cursor: pointer;
}

.survey__option--selected {
  border-color: var(--color-progressive, #36c);
  background-color: var(--background-color-progressive-subtle, #e8eeff);
}

.survey__radio {
  flex-shrink: 0;
  width: 1.125rem;
  height: 1.125rem;
  border: var(--border-width-base, 1px) solid var(--border-color-base, #a2a9b1);
  border-radius: var(--border-radius-circle, 50%);
  background-color: var(--background-color-base);
}

.survey__indicator {
  display: inline-flex;
  flex-shrink: 0;
  width: 1.25rem;
  height: 1.25rem;
  /* Selection feedback (T3.A): restrained scale + fade, no overshoot/bounce.
     `forwards` holds the painted state through the advance hold. */
  animation: survey-check var(--ob-duration-selection, 140ms) var(--ob-ease-out-strong, ease-out)
    forwards;
}

@keyframes survey-check {
  from {
    opacity: 0;
    transform: scale(0.9);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

@media (prefers-reduced-motion: reduce) {
  .survey__indicator {
    animation-name: survey-check-fade;
  }

  @keyframes survey-check-fade {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }
}

/* Codex forces color-base on .cdx-icon, so set the progressive color here
   (not on the parent) for the active checkmark. */
.survey__indicator :deep(.cdx-icon) {
  width: 1.25rem;
  height: 1.25rem;
  color: var(--color-progressive, #36c);
}

.survey__label {
  font-size: var(--font-size-medium, 1rem);
  line-height: var(--line-height-small, 1.375);
  color: var(--color-base);
}
</style>
