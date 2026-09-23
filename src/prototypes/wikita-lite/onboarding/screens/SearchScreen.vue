<script setup lang="ts">
/**
 * Onboarding search: the shared mobile overlay, kept on the flow's URL state.
 *
 * The UI and the fetching live in `MobileSearchOverlay` so this screen and the
 * one the chrome opens elsewhere can't drift apart; what's left here is the
 * wikita-lite half — `?screen=search` as the address, and history-aware back.
 */
import { useRouter } from 'vue-router'

import MobileSearchOverlay from '@/components/search/MobileSearchOverlay.vue'

import { useOnboardingArticleOpener } from '../data/useOnboardingArticleOpener'
import type { FlowState } from '../data/useWikitaLiteOnboardingFlow'

const props = defineProps<{ flow: FlowState }>()

const router = useRouter()

/** A pick has already navigated to the article, so its `close` must not go back. */
let picked = false

useOnboardingArticleOpener(props.flow, () => {
  picked = true
})

function onClose(): void {
  if (picked) return
  // Return to wherever search was opened from (home, an article, …). Opening
  // search pushed a history entry, so stepping back lands on that screen rather
  // than always the main page. Fall back to the main page for a direct deep-link.
  const back = window.history.state?.back
  if (typeof back === 'string' && back.includes('/wikita-lite')) {
    router.back()
    return
  }
  void props.flow.goTo('article')
}
</script>

<template>
  <MobileSearchOverlay client-tag="wikita-lite-onboarding-search" @close="onClose" />
</template>
