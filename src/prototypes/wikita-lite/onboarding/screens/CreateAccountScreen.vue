<script setup lang="ts">
import ChromeHeader from '@/components/chrome/ChromeHeader.vue'
import ChromeWrapper from '@/components/chrome/ChromeWrapper.vue'
import { useKeyboardInset } from '@/composables/useKeyboardInset'

import { useWikitaLiteChromeHeaderRight } from '../../composables/useWikitaLiteChromeHeaderRight'
import CreateAccountForm from '../components/CreateAccountForm.vue'
import type { FlowState } from '../data/useWikitaLiteOnboardingFlow'
import { useReturnHomeBanner } from '../data/useReturnHomeBanner'

const props = defineProps<{ flow: FlowState }>()

const { reset: resetReturnHomeBanner } = useReturnHomeBanner()

useKeyboardInset()
const { headerRight } = useWikitaLiteChromeHeaderRight({ hideUserMenu: true })

function onSubmit({ username, email }: { username: string; email: string }): void {
  resetReturnHomeBanner()
  props.flow.goTo('welcome', {
    username: username || 'NewEditor',
    email,
    title: props.flow.title.value,
  })
}
</script>

<template>
  <ChromeWrapper
    skin="mobile"
    :last-edited-notice="false"
    :show-footer="false"
    :brand-link="false"
  >
    <template #header>
      <ChromeHeader skin="mobile" :right="headerRight" :brand-link="false" />
    </template>
    <div class="account">
      <h1 class="account__title">Create account</h1>
      <CreateAccountForm @submit="onSubmit" />
    </div>
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

.account :deep(.cdx-checkbox__icon::before),
.account :deep(.cdx-radio__icon::before) {
  box-sizing: content-box;
}

.account :deep(.cdx-message__content) {
  font-weight: var(--font-weight-normal);
}
</style>
