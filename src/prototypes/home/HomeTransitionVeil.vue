<script setup lang="ts">
/**
 * The blurred veil over the page while the account is set up
 * (`useHomeTransition`): a spinner and a status during the waits, and the
 * backdrop of the onboarding wizard in between. Rendered by both the
 * create-account page and the Home, so it carries across the route change.
 */
import { computed } from 'vue'
import { CdxProgressIndicator } from '@wikimedia/codex'

import { useHomeOnboarding } from './useHomeOnboarding'
import { useHomeTransition } from './useHomeTransition'

/** On the Home: also veil the page while the wizard is open (e.g. after a reload). */
const props = defineProps<{ withOnboarding?: boolean }>()

const { phase, status } = useHomeTransition()
const { step } = useHomeOnboarding()

const visible = computed(
  () => phase.value !== null || (props.withOnboarding && step.value !== null),
)
</script>

<template>
  <Teleport to="body">
    <div v-if="visible" class="home-transition-veil">
      <div v-if="status" class="home-transition-veil__status" role="status">
        <CdxProgressIndicator>{{ status }}</CdxProgressIndicator>
        <p class="home-transition-veil__text">{{ status }}</p>
      </div>
    </div>
  </Teleport>
</template>

<!-- Teleported, and the view-transition pseudo-elements live on the root, so these can't be scoped. -->
<style>
/* Over the page and its chrome, under the wizard (Codex's dialog backdrop is 400). */
.home-transition-veil {
  position: fixed;
  inset: 0;
  z-index: calc(var(--z-index-overlay-backdrop) - 1);
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: var(--background-color-backdrop-light);
  backdrop-filter: blur(10px);
}

/*
 * The status keeps its own name, so a transition that leaves it in place (the
 * form → the Home) shows it holding still while the page swaps underneath.
 */
.home-transition-veil__status {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--spacing-50);
  max-width: 20rem;
  padding-inline: var(--spacing-100);
  text-align: center;
  view-transition-name: home-transition-status;
}

.home-transition-veil__text {
  margin: 0;
  font-size: var(--font-size-medium);
  line-height: var(--line-height-medium);
  color: var(--color-subtle);
}

/*
 * CODEX+ CdxDialog: no backdrop option. The wizard sits on the veil, so its
 * own dimmed backdrop would double it.
 */
.cdx-dialog-backdrop:has(.home-onboarding-dialog) {
  background-color: transparent;
}

/* A slower crossfade than the browser's 250ms default, so each step reads as one. */
::view-transition-group(*),
::view-transition-old(*),
::view-transition-new(*) {
  animation-duration: 400ms;
}
</style>
