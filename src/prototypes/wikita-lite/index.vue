<script setup lang="ts">
import { computed, ref } from 'vue'

import MobileWrapper from '@/components/MobileWrapper.vue'
import { useConfig } from '@/composables/useConfig'

import { provideWikitaLiteSaveFeedback } from './composables/useWikitaLiteSaveFeedback'
import {
  getWikitaLiteOnboardingUsername,
  isWikitaLiteOnboardingComplete,
} from './onboarding/data/onboardingPersistence'
import WikitaLiteConfigureButton from './components/WikitaLiteConfigureButton.vue'
import WikitaLiteShell from './components/WikitaLiteShell.vue'
import WikitaLiteHome from './WikitaLiteHome.vue'
import WikitaLiteOnboarding from './WikitaLiteOnboarding.vue'

definePage({
  meta: {
    title: 'Wikita-lite',
    description: 'Toned down Wikita dashpage.',
  },
})

const { pageTitle: configPageTitle } = useConfig()
provideWikitaLiteSaveFeedback()

const showOnboarding = ref(!isWikitaLiteOnboardingComplete())

const pageTitle = computed(() => {
  const onboardingName = getWikitaLiteOnboardingUsername()
  if (onboardingName) return `Hello, ${onboardingName}!`
  return configPageTitle.value
})

function onOnboardingCompleted(): void {
  showOnboarding.value = false
}
</script>

<template>
  <MobileWrapper v-if="showOnboarding" max-width="412px" :show-frame-border="false">
    <WikitaLiteOnboarding @completed="onOnboardingCompleted" />
  </MobileWrapper>

  <WikitaLiteShell v-else :title="pageTitle" actions>
    <template #actions>
      <WikitaLiteConfigureButton />
    </template>
    <WikitaLiteHome />
  </WikitaLiteShell>
</template>
