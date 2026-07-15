<script setup lang="ts">
import { onBeforeUnmount, ref } from 'vue'
import { CdxDialog } from '@wikimedia/codex'

import MobileWrapper from '@/components/MobileWrapper.vue'
import { useConfig } from '@/composables/useConfig'

import './components/onboarding-motion.css'
import { useFlowState } from './data/useFlowState'
import SearchScreen from './screens/SearchScreen.vue'
import ReadScreen from './screens/ReadScreen.vue'
import CreateAccountScreen from './screens/CreateAccountScreen.vue'

definePage({
  meta: {
    title: 'Account creation',
    description: 'A streamlined account-creation flow.',
  },
})

const flow = useFlowState()
const { user } = useConfig()

// Intro dialog shown on every open, orienting Wikimania participants before
// they start the flow. Purely informational — the single "Got it" action just
// dismisses it.
const showIntro = ref(true)
const introAction = {
  label: 'Got it',
  actionType: 'progressive' as const,
}

// The whole prototype is logged-out — no account is ever really created — so
// keep the chrome logged-out for the session (unless the gallery is previewing
// a real user) and restore whatever the gallery had on exit.
const originalUser = user.value
if (user.value !== 'real') user.value = 'logged-out'

onBeforeUnmount(() => {
  user.value = originalUser
})
</script>

<template>
  <MobileWrapper max-width="412px" :show-frame-border="false">
    <CdxDialog
      v-model:open="showIntro"
      title="Account creation prototype"
      close-button-label="Close"
      :dismissable="true"
      :primary-action="introAction"
      @primary="showIntro = false"
    >
      <p class="nd-intro__lead">
        This is a prototype for testing at Wikimania. Nothing you enter is saved or stored.
      </p>
      <p>To try it out:</p>
      <ol class="nd-intro__steps">
        <li>Open the account menu.</li>
        <li>Try to create an account.</li>
      </ol>
      <p>Thanks for helping us test!</p>
    </CdxDialog>

    <!--
      Region fade between screens with unrelated layouts (e.g. Read -> Create
      account): sequential fade-out -> hold -> fade-in.
    -->
    <Transition name="ob-fade" mode="out-in">
      <SearchScreen v-if="flow.screen.value === 'search'" key="search" :flow="flow" />
      <CreateAccountScreen
        v-else-if="flow.screen.value === 'account'"
        key="account"
        :flow="flow"
      />
      <ReadScreen v-else key="read" :flow="flow" />
    </Transition>
  </MobileWrapper>
</template>

<style scoped>
.nd-intro__lead {
  margin-top: 0;
}

.nd-intro__steps {
  margin: var(--spacing-50, 8px) 0;
  padding-inline-start: var(--spacing-150, 24px);
}

.nd-intro__steps li {
  margin-bottom: var(--spacing-25, 4px);
}
</style>
