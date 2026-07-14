<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { CdxButton } from '@wikimedia/codex'

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
  <!--
    First-run celebration. The screen fades in via the shell's region transition
    (T1); these blocks then stagger their own transform in on top of that fade,
    the globe (mascot) leading with a touch more presence (scale). This
    stagger/scale treatment is reserved for this one moment — steps 2/3 stay
    efficient and consistent.
  -->
  <div class="welcome">
    <h1 class="welcome__title ob-stagger ob-stagger--1">{{ greeting }}</h1>

    <div class="welcome__illustration ob-stagger ob-stagger--lead">
      <img class="welcome__hero" :src="heroSrc" alt="" width="480" height="480" />
    </div>

    <div class="welcome__actions ob-stagger ob-stagger--2">
      <CdxButton action="progressive" weight="primary" @click="props.flow.goTo('survey')">
        Personalize your Home
      </CdxButton>
    </div>
  </div>
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
  flex-grow: 1;
  margin: 0;
  padding: var(--spacing-400, 64px) var(--spacing-100, 16px) 0;
  font-family: var(--font-family-serif);
  font-size: var(--font-size-xxx-large, 2rem);
  font-weight: var(--font-weight-normal, 400);
  line-height: var(--line-height-xxx-large, 1.375);
  color: var(--color-base);
}

.welcome__illustration {
  padding: var(--spacing-100, 16px);
}

.welcome__hero {
  display: block;
  width: 100%;
  height: 100%;
  border: none;
  object-fit: contain;
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

/* First-run reveal (T1 step 4): each block eases up, the globe leads with a
   scale pop. Runs once on mount over the region fade; capped at three blocks —
   all the DOM this screen has. */
.ob-stagger {
  animation: ob-rise var(--ob-duration-fade-in, 280ms) var(--ob-ease-out-strong, ease-out) both;
}

.ob-stagger--lead {
  animation-name: ob-pop;
  animation-delay: calc(var(--ob-stagger-step, 50ms) * 1);
}

.ob-stagger--1 {
  animation-delay: calc(var(--ob-stagger-step, 50ms) * 0);
}

.ob-stagger--2 {
  animation-delay: calc(var(--ob-stagger-step, 50ms) * 2);
}

@keyframes ob-rise {
  from {
    opacity: 0;
    transform: translateY(8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes ob-pop {
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
  /* Keep the fade, drop the translate/scale distance. */
  .ob-stagger {
    animation-name: ob-fade-only;
  }

  .ob-stagger--lead {
    animation-name: ob-fade-only;
  }

  @keyframes ob-fade-only {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }
}
</style>
