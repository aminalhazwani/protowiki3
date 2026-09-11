<script setup lang="ts">
import { computed } from 'vue'

import MobileWrapper from '@/components/MobileWrapper.vue'
import { useConfig } from '@/composables/useConfig'

import { provideWikitaLiteSaveFeedback } from './composables/useWikitaLiteSaveFeedback'
import { useWikitaLiteLeavePrototype } from './composables/useWikitaLiteLeavePrototype'
import { useWikitaLitePrototypeSplash } from './composables/useWikitaLitePrototypeSplash'
import { initWikitaLiteUrlState, useWikitaLiteUrlState } from './composables/useWikitaLiteUrlState'
import WikitaLiteConfigureButton from './components/WikitaLiteConfigureButton.vue'
import WikitaLiteLeavePrototypeDialog from './components/WikitaLiteLeavePrototypeDialog.vue'
import WikitaLitePrototypeSplash from './components/WikitaLitePrototypeSplash.vue'
import WikitaLiteShell from './components/WikitaLiteShell.vue'
import WikitaLiteHome from './WikitaLiteHome.vue'
import WikitaLiteOnboarding from './WikitaLiteOnboarding.vue'

definePage({
  meta: {
    title: 'Home',
    description: 'A demo where you go through onboarding and then land in a personalized Home.',
  },
})

initWikitaLiteUrlState()
provideWikitaLiteSaveFeedback()

const { pageTitle: configPageTitle } = useConfig()
const { isOnboarded, state } = useWikitaLiteUrlState()
const { showSplash } = useWikitaLitePrototypeSplash()
const { onLeaveCapture } = useWikitaLiteLeavePrototype()

const showOnboarding = computed(() => !isOnboarded.value)

const pageTitle = computed(() => {
  const name = state.value.displayName || state.value.username
  if (name) return `Hello, ${name}!`
  return configPageTitle.value
})
</script>

<template>
  <MobileWrapper v-if="showOnboarding" max-width="412px" :show-frame-border="false">
    <div class="wikita-lite-index" @click.capture="onLeaveCapture">
      <WikitaLiteOnboarding v-if="!showSplash" />
      <WikitaLitePrototypeSplash v-if="showSplash" />
      <WikitaLiteLeavePrototypeDialog />
    </div>
  </MobileWrapper>

  <WikitaLiteShell v-else :title="pageTitle" actions>
    <template #actions>
      <WikitaLiteConfigureButton />
    </template>
    <WikitaLiteHome />
    <template #overlay>
      <WikitaLitePrototypeSplash v-if="showSplash" />
    </template>
  </WikitaLiteShell>
</template>

<style scoped>
.wikita-lite-index {
  position: relative;
  display: flex;
  flex-direction: column;
  flex: 1 1 auto;
  min-height: 100vh;
  min-height: 100dvh;
}
</style>
