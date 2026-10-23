<script setup lang="ts">
/**
 * The prototype's intro (home2's splash): what this is and how to try it. It
 * sits over the logged-out Main Page, which loads behind it; Begin, ✕, Escape
 * and the backdrop all dismiss it for good.
 */
import { computed } from 'vue'
import { CdxButton } from '@wikimedia/codex'

import HomeDialogShell from './HomeDialogShell.vue'
import { useHomeSplash } from './useHomeSplash'

const splash = useHomeSplash()

const open = computed({
  get: () => splash.open.value,
  set: (value) => {
    if (!value) splash.dismiss()
  },
})
</script>

<template>
  <HomeDialogShell v-model:open="open" title="Home prototype">
    <p>This is an experimental prototype. Nothing you enter here is saved or stored.</p>
    <p>To try it out:</p>
    <ol class="home-splash__steps">
      <li>Navigate to an article that interests you.</li>
      <li>Create an account from that page.</li>
      <li>Answer the onboarding questions to get a personalized Home.</li>
    </ol>
    <p>Thanks for helping us to test this.</p>

    <template #footer>
      <CdxButton
        class="home-splash__begin"
        action="progressive"
        weight="primary"
        size="large"
        @click="splash.dismiss"
      >
        Begin
      </CdxButton>
    </template>
  </HomeDialogShell>
</template>

<style scoped>
/* The items' margins stay inside the list (home2's flex-column body), 4px clear of its edges. */
.home-splash__steps {
  display: flow-root;
}

/* The whole footer (Codex caps buttons at 28rem), as in the onboarding wizard. */
.home-splash__begin {
  width: 100%;
  max-width: none;
}
</style>
