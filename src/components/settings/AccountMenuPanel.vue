<script setup lang="ts">
import { CdxIcon } from '@wikimedia/codex'
import { cdxIconLogIn, cdxIconUserAvatar } from '@wikimedia/codex-icons'

defineEmits<{ 'create-account': []; 'log-in': [] }>()
</script>

<template>
  <div class="account-menu-panel">
    <button type="button" class="account-menu-panel__item" @click="$emit('create-account')">
      <CdxIcon :icon="cdxIconUserAvatar" />
      <span class="account-menu-panel__label">Create account</span>
    </button>
    <button type="button" class="account-menu-panel__item" @click="$emit('log-in')">
      <CdxIcon :icon="cdxIconLogIn" />
      <span class="account-menu-panel__label">Log in</span>
    </button>
  </div>
</template>

<style scoped>
.account-menu-panel {
  display: flex;
  flex-direction: column;
  min-width: 14rem;
}

.account-menu-panel__item {
  display: flex;
  align-items: center;
  gap: var(--spacing-75, 12px);
  width: 100%;
  margin: 0;
  padding: var(--spacing-75, 12px) var(--spacing-100, 16px);
  border: 0;
  background: transparent;
  color: var(--color-base, #202122);
  font: inherit;
  text-align: start;
  cursor: pointer;
}

.account-menu-panel__item:hover {
  background-color: var(--background-color-interactive-subtle, #f8f9fa);
}

.account-menu-panel__label {
  font-size: var(--font-size-medium, 1rem);
  font-weight: var(--font-weight-bold, 700);
  line-height: 1.4;
}
</style>
