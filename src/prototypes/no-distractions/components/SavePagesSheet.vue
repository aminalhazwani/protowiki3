<script setup lang="ts">
import { CdxPopover } from '@wikimedia/codex'

import type { FlowState } from '../data/useFlowState'

const open = defineModel<boolean>('open', { default: false })

const props = defineProps<{ flow: FlowState }>()

const primaryAction = {
  label: 'Create account',
  actionType: 'progressive' as const,
}

const defaultAction = {
  label: 'Log in',
}

function onCreateAccount(): void {
  open.value = false
  void props.flow.goTo('account')
}

function onLogIn(): void {
  open.value = false
  void props.flow.goTo('home')
}
</script>

<template>
  <CdxPopover
    v-model:open="open"
    class="save-pages-sheet"
    use-bottom-sheet
    title="Save pages"
    :use-close-button="true"
    :primary-action="primaryAction"
    :default-action="defaultAction"
    :stacked-actions="true"
    @primary="onCreateAccount"
    @default="onLogIn"
  >
    Please log in or create an account to get started.
  </CdxPopover>
</template>

<!-- Teleported popover: match onboarding dashpage CTA sizing (onboarding-layout.css). -->
<style>
.save-pages-sheet .cdx-popover__header__title {
  font-family: var(--font-family-base, sans-serif);
  font-size: var(--font-size-x-large, 1.25rem);
  font-weight: var(--font-weight-bold);
  line-height: var(--line-height-x-large, 1.5);
}

.save-pages-sheet .cdx-popover__footer__actions .cdx-button {
  box-sizing: border-box;
  width: 100%;
  min-height: 3rem;
  padding-block: var(--spacing-100, 16px);
  font-size: var(--font-size-medium, 1rem);
  font-weight: var(--font-weight-bold);
}
</style>
