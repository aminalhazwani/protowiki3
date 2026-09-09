<script setup lang="ts">
import { computed } from 'vue'

import MobileWrapper from '@/components/MobileWrapper.vue'
import { useConfig } from '@/composables/useConfig'

import { provideWikitaLiteSaveFeedback } from './composables/useWikitaLiteSaveFeedback'
import { initWikitaLiteUrlState, useWikitaLiteUrlState } from './composables/useWikitaLiteUrlState'
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

initWikitaLiteUrlState()
provideWikitaLiteSaveFeedback()

const { pageTitle: configPageTitle } = useConfig()
const { isOnboarded, state } = useWikitaLiteUrlState()

const showOnboarding = computed(() => !isOnboarded.value)

const pageTitle = computed(() => {
  const name = state.value.displayName || state.value.username
  if (name) return `Hello, ${name}!`
  return configPageTitle.value
})
</script>

<template>
  <MobileWrapper v-if="showOnboarding" max-width="412px" :show-frame-border="false">
    <WikitaLiteOnboarding />
  </MobileWrapper>

  <WikitaLiteShell v-else :title="pageTitle" actions>
    <template #actions>
      <WikitaLiteConfigureButton />
    </template>
    <WikitaLiteHome />
  </WikitaLiteShell>
</template>
