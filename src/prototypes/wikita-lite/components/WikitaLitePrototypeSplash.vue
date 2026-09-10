<script setup lang="ts">
import { useWikitaLitePrototypeSplash } from '../composables/useWikitaLitePrototypeSplash'
import WikitaLiteFullscreenDialogShell from './WikitaLiteFullscreenDialogShell.vue'

const { dismissSplash } = useWikitaLitePrototypeSplash()
</script>

<template>
  <WikitaLiteFullscreenDialogShell
    title="Home prototype"
    :primary-action="{ label: 'Begin', actionType: 'progressive' }"
    @primary="dismissSplash"
    @close="dismissSplash"
  >
    <p>This is an experimental prototype. Nothing you enter here is saved or stored.</p>
    <p>To try it out:</p>
    <ol>
      <li>Navigate to an article that interests you.</li>
      <li>Create an account from that page.</li>
      <li>Answer the onboarding questions to get a personalized Home.</li>
    </ol>
    <p>Thanks for helping us to test this.</p>
  </WikitaLiteFullscreenDialogShell>
</template>
