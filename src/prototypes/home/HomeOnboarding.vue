<script setup lang="ts">
/**
 * The onboarding wizard (home2's "Personalize your Home"), over the new
 * reader's Home: a step counter, the step, and its call to action. Step 1
 * closes with ✕; later steps go back instead. Escape does the same.
 */
import { computed, type Component } from 'vue'
import { CdxButton, CdxIcon } from '@wikimedia/codex'
import { cdxIconClose, cdxIconPrevious } from '@wikimedia/codex-icons'

import type { OnboardingStep } from './data/onboarding'
import HomeDialogShell from './HomeDialogShell.vue'
import HomeOnboardingWelcome from './HomeOnboardingWelcome.vue'
import { useHomeOnboarding } from './useHomeOnboarding'

/** Each step's screen and footer button. */
const STEPS: Record<OnboardingStep, { body: Component; cta: string }> = {
  welcome: { body: HomeOnboardingWelcome, cta: 'Personalize your Home' },
}

const { step, index, total, next, back, finish } = useHomeOnboarding()

const current = computed(() => (step.value ? STEPS[step.value] : null))
const isFirst = computed(() => index.value <= 0)

function onNavigate(): void {
  if (isFirst.value) finish()
  else back()
}

/* The dialog's own dismissals (Escape, backdrop) navigate too; going back keeps it open. */
const open = computed({
  get: () => step.value !== null,
  set: (value: boolean) => {
    if (!value) onNavigate()
  },
})
</script>

<template>
  <HomeDialogShell v-if="current" v-model:open="open" title="Personalize your Home" tall>
    <template #header>
      <div class="home-onboarding__header">
        <CdxButton
          class="home-onboarding__nav"
          weight="quiet"
          :aria-label="isFirst ? 'Close' : 'Go back'"
          @click="onNavigate"
        >
          <CdxIcon :icon="isFirst ? cdxIconClose : cdxIconPrevious" />
        </CdxButton>
        <span class="home-onboarding__counter">{{ index + 1 }} of {{ total }}</span>
      </div>
    </template>

    <component :is="current.body" :key="step" />

    <template #footer>
      <CdxButton
        class="home-onboarding__cta"
        action="progressive"
        weight="primary"
        size="large"
        @click="next"
      >
        {{ current.cta }}
      </CdxButton>
    </template>
  </HomeDialogShell>
</template>

<style scoped>
.home-onboarding__header {
  display: flex;
  flex: 1 1 auto;
  align-items: center;
  justify-content: space-between;
}

/* The quiet button's icon lines up with the content edge, as Codex's close button does. */
.home-onboarding__nav {
  margin-inline-start: calc(-1 * var(--spacing-50));
}

.home-onboarding__counter {
  font-size: var(--font-size-medium);
  line-height: var(--line-height-small);
  color: var(--color-subtle);
}

/* The step's whole footer (Codex caps buttons at 28rem). */
.home-onboarding__cta {
  width: 100%;
  max-width: none;
}
</style>
