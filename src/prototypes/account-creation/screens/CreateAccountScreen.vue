<script setup lang="ts">
import { ref } from 'vue'
import { CdxDialog } from '@wikimedia/codex'
import ChromeWrapper from '@/components/chrome/ChromeWrapper.vue'

import CreateAccountForm from '../components/CreateAccountForm.vue'

import type { FlowState } from '../data/useFlowState'

const props = defineProps<{ flow: FlowState }>()

// Account creation is a dead end in this prototype: submitting the form doesn't
// create anything or advance to onboarding. We just confirm with a dialog (and
// a console line) so testers get clear feedback that the flow reached the end.
const showCreated = ref(false)

const createdAction = {
  label: 'Got it',
  actionType: 'progressive' as const,
}

function onSubmit(): void {
  // eslint-disable-next-line no-console
  console.log('Fictional account created')
  showCreated.value = true
}

function onCreateAccount(): void {
  props.flow.goTo('account')
}
</script>

<template>
  <ChromeWrapper
    skin="mobile"
    :last-edited-notice="false"
    brand-to="/account-creation"
    hide-actions
    @create-account="onCreateAccount"
  >
    <div class="account">
      <h1 class="account__title">Create account</h1>
      <CreateAccountForm @submit="onSubmit" />
    </div>

    <CdxDialog
      v-model:open="showCreated"
      title="Fictional account created"
      close-button-label="Close"
      :dismissable="true"
      :primary-action="createdAction"
      @primary="showCreated = false"
    >
      This is a prototype — no real account was created and nothing you entered was saved.
    </CdxDialog>
  </ChromeWrapper>
</template>

<style scoped>
.account {
  padding: var(--spacing-100, 16px);
  padding-bottom: var(--spacing-200, 32px);
}

.account__title {
  margin: 0 0 var(--spacing-150, 24px) 0;
  font-family:
    var(--font-family-system-sans, system-ui, sans-serif), var(--font-family-base, sans-serif);
  font-size: var(--font-size-xx-large, 1.5rem);
  font-weight: var(--font-weight-bold);
  line-height: var(--line-height-xxx-large, 1.375);
  color: var(--color-base);
}

/*
 * Codex overrides the ported form depends on. protowiki3's global.css applies
 * `box-sizing: border-box` to every element (including pseudo-elements); Codex's
 * checkbox / radio check marks are drawn as `::before` pseudo-elements that
 * assume the spec-default `content-box`, so restore it here to keep them centered.
 */
.account :deep(.cdx-checkbox__icon::before),
.account :deep(.cdx-radio__icon::before) {
  box-sizing: content-box;
}

/* Validation messages render at normal weight, matching account-creation-v3-alt. */
.account :deep(.cdx-message__content) {
  font-weight: var(--font-weight-normal);
}
</style>
