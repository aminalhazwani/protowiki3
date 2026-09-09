<script setup lang="ts">
import { CdxButton } from '@wikimedia/codex'

import { useWikitaLitePrototypeSplash } from '../composables/useWikitaLitePrototypeSplash'
import WikitaLiteFullscreenDialogShell from './WikitaLiteFullscreenDialogShell.vue'

const { dismissSplash } = useWikitaLitePrototypeSplash()
</script>

<template>
  <WikitaLiteFullscreenDialogShell title="Home prototype" @close="dismissSplash">
    <div class="wikita-lite-prototype-splash">
      <p class="wikita-lite-prototype-splash__intro">
        This is an experimental prototype. Nothing you enter here is saved or stored.
      </p>
      <p class="wikita-lite-prototype-splash__lead">To try it out:</p>
      <ol class="wikita-lite-prototype-splash__steps">
        <li>Navigate to an article that interests you.</li>
        <li>Create an account from that page.</li>
        <li>Answer the onboarding questions to get a personalized Home.</li>
      </ol>
      <p class="wikita-lite-prototype-splash__thanks">Thanks for helping us to test this.</p>
      <CdxButton
        class="wikita-lite-prototype-splash__begin"
        size="large"
        weight="primary"
        action="progressive"
        @click="dismissSplash"
      >
        Begin
      </CdxButton>
    </div>
  </WikitaLiteFullscreenDialogShell>
</template>

<style scoped>
.wikita-lite-prototype-splash {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-100, 16px);
  padding-bottom: var(--spacing-150, 24px);
}

.wikita-lite-prototype-splash__intro,
.wikita-lite-prototype-splash__lead,
.wikita-lite-prototype-splash__thanks {
  margin: 0;
  color: var(--color-base, #202122);
}

.wikita-lite-prototype-splash__steps {
  margin: 0;
  padding-inline-start: var(--spacing-150, 24px);
  color: var(--color-base, #202122);
}

.wikita-lite-prototype-splash__steps li + li {
  margin-top: var(--spacing-50, 8px);
}

.wikita-lite-prototype-splash__begin {
  width: 100%;
  margin-top: var(--spacing-50, 8px);
}
</style>
