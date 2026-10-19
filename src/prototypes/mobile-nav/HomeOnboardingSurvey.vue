<script setup lang="ts">
/**
 * Onboarding step 2 (home2): "What brings you to Wikipedia?" Three Codex cards
 * act as one radio group; a pick is saved, held a moment so it registers, then
 * the wizard moves on. The answer picks the default Home layout.
 */
import { computed, onBeforeUnmount, ref } from 'vue'
import { CdxCard } from '@wikimedia/codex'

import type { SurveyAnswer } from './data/onboarding'
import { useHomeOnboarding } from './useHomeOnboarding'

/** The hold between the pick and the step change. */
const SELECTION_HOLD_MS = 400

const QUESTION = 'What brings you to Wikipedia?'

const OPTIONS: { value: SurveyAnswer; label: string; description: string }[] = [
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
  { value: 'both', label: 'A bit of both', description: 'Read, save, and make a few edits too.' },
]

const { survey, setSurvey, next } = useHomeOnboarding()

const picked = ref<SurveyAnswer | null>(null)
const selected = computed(() => picked.value ?? survey.value)

// Roving tabindex: Tab lands on the selected card (or the first); arrows move between them.
const activeIndex = computed(() =>
  Math.max(
    OPTIONS.findIndex((option) => option.value === selected.value),
    0,
  ),
)

const cards = ref<HTMLElement[]>([])
function setCard(el: unknown, index: number): void {
  // A CdxCard's ref is the component; its root `<a>` takes the focus.
  if (el) cards.value[index] = (el as { $el: HTMLElement }).$el
}

let timer: ReturnType<typeof setTimeout> | undefined

function choose(value: SurveyAnswer): void {
  if (picked.value) return // Already moving on.
  picked.value = value
  setSurvey(value)
  timer = setTimeout(next, SELECTION_HOLD_MS)
}

/** Enter and Space pick the focused card, as on a native radio (Space would scroll). */
function onKeydown(event: KeyboardEvent, value: SurveyAnswer): void {
  if (event.key !== 'Enter' && event.key !== ' ') return
  event.preventDefault()
  choose(value)
}

/** Arrows move focus to the neighbouring card and pick it (selection follows focus, home2). */
function onArrows(event: KeyboardEvent): void {
  const forward = event.key === 'ArrowDown' || event.key === 'ArrowRight'
  const back = event.key === 'ArrowUp' || event.key === 'ArrowLeft'
  if ((!forward && !back) || picked.value) return
  event.preventDefault()
  const index = (activeIndex.value + (forward ? 1 : -1) + OPTIONS.length) % OPTIONS.length
  cards.value[index]?.focus()
  choose(OPTIONS[index].value)
}

onBeforeUnmount(() => clearTimeout(timer))
</script>

<template>
  <div class="home-onboarding-survey">
    <h1 class="home-onboarding-title">{{ QUESTION }}</h1>
    <!--
      Each option is a stock CdxCard; `url` makes it a link, so hover, active and
      focus come from Codex. The card is the radio itself (role + aria-checked)
      with its navigation prevented: one Tab stop, nothing nested.
    -->
    <div
      class="home-onboarding-survey__options"
      role="radiogroup"
      :aria-label="QUESTION"
      @keydown="onArrows"
    >
      <CdxCard
        v-for="(option, index) in OPTIONS"
        :key="option.value"
        :ref="(el) => setCard(el, index)"
        url="#"
        role="radio"
        :aria-checked="selected === option.value"
        :tabindex="activeIndex === index ? 0 : -1"
        @click.prevent="choose(option.value)"
        @keydown="onKeydown($event, option.value)"
      >
        <template #title>{{ option.label }}</template>
        <template #description>{{ option.description }}</template>
      </CdxCard>
    </div>
  </div>
</template>

<style scoped>
.home-onboarding-survey__options {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-75);
  padding-top: var(--spacing-75);
}
</style>
