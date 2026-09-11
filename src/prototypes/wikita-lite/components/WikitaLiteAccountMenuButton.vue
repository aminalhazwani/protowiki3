<script setup lang="ts">
import { CdxButton, CdxIcon } from '@wikimedia/codex'
import { cdxIconUserAvatarOutline } from '@wikimedia/codex-icons'

import AccountMenuPopover from '@/components/settings/AccountMenuPopover.vue'

import { useWikitaLiteUrlState } from '../composables/useWikitaLiteUrlState'
import { useWikitaLiteOnboardingFlow } from '../onboarding/data/useWikitaLiteOnboardingFlow'

const flow = useWikitaLiteOnboardingFlow()
const { isOnboarded, patchState } = useWikitaLiteUrlState()

async function onCreateAccount(): Promise<void> {
  if (isOnboarded.value) {
    await patchState({ onboarded: false })
  }
  await flow.goTo('account')
}
</script>

<template>
  <AccountMenuPopover class="wikita-lite-account-menu" @create-account="onCreateAccount">
    <template #default="{ toggle, open }">
      <span class="wikita-lite-account-menu__trigger">
        <CdxButton
          weight="quiet"
          size="large"
          aria-label="User menu"
          :aria-expanded="open"
          @click="toggle"
        >
          <CdxIcon :icon="cdxIconUserAvatarOutline" size="medium" />
        </CdxButton>
      </span>
    </template>
  </AccountMenuPopover>
</template>

<style scoped>
.wikita-lite-account-menu {
  width: var(--size-icon-large, 40px);
}

.wikita-lite-account-menu__trigger {
  display: inline-flex;
  width: 100%;
  justify-content: center;
}

.wikita-lite-account-menu__trigger :deep(.cdx-button) {
  box-sizing: border-box;
  flex-shrink: 0;
  width: var(--size-icon-large, 40px);
  min-width: var(--size-icon-large, 40px);
  max-width: var(--size-icon-large, 40px);
  height: var(--size-icon-large, 40px);
  min-height: var(--size-icon-large, 40px);
  padding: 0;
  color: var(--color-subtle, #54595d);
  display: inline-flex;
  align-items: center;
  justify-content: center;
}
</style>
