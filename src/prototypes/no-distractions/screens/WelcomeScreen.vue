<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { CdxButton } from '@wikimedia/codex'

import OnboardingShell from '../components/OnboardingShell.vue'
import type { FlowState } from '../data/useFlowState'

const props = defineProps<{ flow: FlowState }>()

const GLOBE = `${import.meta.env.BASE_URL}images/no-distractions-welcome-globe.gif`

/**
 * The globe GIF is authored to animate once and hold its last frame. Appending a
 * unique query param on mount forces the browser to reload it from frame 1, so the
 * animation replays each time the welcome screen is opened (screens are v-if-mounted).
 */
const heroSrc = ref(GLOBE)
onMounted(() => {
  heroSrc.value = `${GLOBE}?t=${Date.now()}`
})

const greeting = computed(() => {
  const name = props.flow.username.value
  return name ? `Welcome to Wikipedia, ${name}!` : 'Welcome to Wikipedia!'
})
</script>

<template>
  <OnboardingShell :current="1" flush-content @dismiss="props.flow.goTo('home')">
    <div class="welcome">
      <h1 class="welcome__title">{{ greeting }}</h1>

      <div class="welcome__illustration">
        <img class="welcome__hero" :src="heroSrc" alt="" width="480" height="480" />
      </div>

      <div class="welcome__actions">
        <CdxButton action="progressive" weight="primary" @click="props.flow.goTo('survey')">
          Personalize your Home
        </CdxButton>
      </div>
    </div>
  </OnboardingShell>
</template>

<style scoped>
.welcome {
  display: flex;
  flex-direction: column;
  flex: 1 1 auto;
  min-height: 100%;
  background-color: var(--background-color-base, #fff);
}

.welcome__title {
  margin: 0;
  padding: var(--spacing-400, 64px) var(--spacing-100, 16px) 0;
  font-family: var(--font-family-serif);
  font-size: var(--font-size-xxx-large, 2rem);
  font-weight: var(--font-weight-normal, 400);
  line-height: var(--line-height-xxx-large, 1.375);
  color: var(--color-base);
}

.welcome__illustration {
  display: flex;
  flex: 1 1 auto;
  align-items: center;
  justify-content: center;
  min-height: 0;
  padding: var(--spacing-100, 16px);
}

.welcome__hero {
  display: block;
  width: 100%;
  max-width: 15rem;
  height: auto;
  border: none;
}

.welcome__actions {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-75, 12px);
  padding: var(--spacing-100, 16px);
  padding-bottom: max(var(--spacing-100, 16px), env(safe-area-inset-bottom));
}

.welcome__actions :deep(.cdx-button) {
  box-sizing: border-box;
  width: 100%;
  min-height: 3rem;
  padding-block: var(--spacing-100, 16px);
  font-size: var(--font-size-medium, 1rem);
  font-weight: var(--font-weight-bold);
}
</style>
