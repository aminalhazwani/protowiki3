<script setup lang="ts">
/**
 * The onboarding wizard (home2's "Personalize your Home"), over the new
 * reader's Home: a step counter, the step, and its call to action. Step 1
 * closes with ✕; later steps go back instead. Escape does the same.
 */
import { computed, ref, watch, type Component } from 'vue'
import { CdxButton, CdxIcon } from '@wikimedia/codex'
import { cdxIconClose, cdxIconPrevious } from '@wikimedia/codex-icons'

import type { OnboardingStep } from './data/onboarding'
import HomeDialogShell from './HomeDialogShell.vue'
import HomeOnboardingSurvey from './HomeOnboardingSurvey.vue'
import HomeOnboardingWelcome from './HomeOnboardingWelcome.vue'
import { useHomeOnboarding } from './useHomeOnboarding'

const { step, index, total, next, back, finish, setSurvey } = useHomeOnboarding()

/** Each step's screen and footer button (`primary`: the step's main action; else quiet). */
const STEPS: Record<
  OnboardingStep,
  { body: Component; cta: string; primary: boolean; onCta: () => void }
> = {
  welcome: {
    body: HomeOnboardingWelcome,
    cta: 'Personalize your Home',
    primary: true,
    onCta: next,
  },
  survey: {
    body: HomeOnboardingSurvey,
    cta: 'Skip',
    primary: false,
    // Skipping counts as "A bit of both" (home2).
    onCta: () => {
      setSurvey('both')
      next()
    },
  },
}

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

/* Steps slide the way the reader is going, and the counter rolls with them (home2). */
const forward = ref(true)
watch(index, (to, from) => {
  if (to >= 0 && from >= 0) forward.value = to > from
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
        <span class="home-onboarding__counter">
          <!-- Only the digit rolls; " of N" stays put. -->
          <span class="home-onboarding__digit">
            <Transition :name="forward ? 'home-onboarding-roll-up' : 'home-onboarding-roll-down'">
              <span :key="index">{{ index + 1 }}</span>
            </Transition>
          </span>
          &nbsp;of {{ total }}
        </span>
      </div>
    </template>

    <div class="home-onboarding__viewport">
      <Transition :name="forward ? 'home-onboarding-forward' : 'home-onboarding-back'">
        <component :is="current.body" :key="step" class="home-onboarding__step" />
      </Transition>
    </div>

    <template #footer>
      <CdxButton
        class="home-onboarding__cta"
        :action="current.primary ? 'progressive' : 'default'"
        :weight="current.primary ? 'primary' : 'quiet'"
        size="large"
        @click="current.onCta"
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
  display: inline-flex;
  align-items: baseline;
  font-size: var(--font-size-medium);
  line-height: var(--line-height-small);
  color: var(--color-subtle);
}

/* The digit's one-line slot: the leaving digit overlaps the entering one, clipped. */
.home-onboarding__digit {
  position: relative;
  display: inline-block;
  min-width: 1ch;
  overflow: hidden;
  text-align: center;
}

.home-onboarding__digit > span {
  display: inline-block;
}

/* Steps share one box while one slides out and the next slides in. */
.home-onboarding__viewport {
  position: relative;
  display: flex;
  flex: 1 1 auto;
  flex-direction: column;
  min-height: 0;
  overflow-x: clip;
}

.home-onboarding__step {
  flex: 1 1 auto;
}

/* The step's whole footer (Codex caps buttons at 28rem). */
.home-onboarding__cta {
  width: 100%;
  max-width: none;
}

/*
 * home2's motion. Steps: a 32px nudge, not a full-width push (one flow), gliding
 * in-out while the fade eases out; the incoming step starts 30ms late. Counter:
 * the digit rolls up going forward, down going back.
 */
.home-onboarding-forward-enter-active,
.home-onboarding-forward-leave-active,
.home-onboarding-back-enter-active,
.home-onboarding-back-leave-active {
  transition:
    transform 260ms cubic-bezier(0.77, 0, 0.175, 1),
    opacity 260ms cubic-bezier(0.23, 1, 0.32, 1);
}

.home-onboarding-forward-enter-active,
.home-onboarding-back-enter-active {
  transition-delay: 30ms;
}

.home-onboarding-forward-leave-active,
.home-onboarding-back-leave-active,
.home-onboarding-roll-up-leave-active,
.home-onboarding-roll-down-leave-active {
  position: absolute;
  inset: 0;
}

.home-onboarding-forward-enter-from,
.home-onboarding-back-leave-to {
  opacity: 0;
  transform: translateX(32px);
}

.home-onboarding-forward-leave-to,
.home-onboarding-back-enter-from {
  opacity: 0;
  transform: translateX(-32px);
}

.home-onboarding-roll-up-enter-active,
.home-onboarding-roll-up-leave-active,
.home-onboarding-roll-down-enter-active,
.home-onboarding-roll-down-leave-active {
  transition:
    transform 160ms cubic-bezier(0.23, 1, 0.32, 1),
    opacity 160ms cubic-bezier(0.23, 1, 0.32, 1);
}

.home-onboarding-roll-up-enter-from,
.home-onboarding-roll-down-leave-to {
  opacity: 0;
  transform: translateY(100%);
}

.home-onboarding-roll-up-leave-to,
.home-onboarding-roll-down-enter-from {
  opacity: 0;
  transform: translateY(-100%);
}

/* Keep the fades, drop the movement. */
@media (prefers-reduced-motion: reduce) {
  .home-onboarding-forward-enter-from,
  .home-onboarding-forward-leave-to,
  .home-onboarding-back-enter-from,
  .home-onboarding-back-leave-to,
  .home-onboarding-roll-up-enter-from,
  .home-onboarding-roll-up-leave-to,
  .home-onboarding-roll-down-enter-from,
  .home-onboarding-roll-down-leave-to {
    transform: none;
  }
}
</style>
