<script setup lang="ts">
import { ref } from 'vue'

import { CdxPopover } from '@wikimedia/codex'

import AccountMenuPanel from './AccountMenuPanel.vue'

const emit = defineEmits<{ 'create-account': [] }>()

const open = ref(false)
const anchor = ref<HTMLElement | null>(null)

function toggle(): void {
  open.value = !open.value
}

function onCreateAccount(): void {
  open.value = false
  emit('create-account')
}

function onLogIn(): void {
  // Placeholder for now — just close the menu.
  open.value = false
}
</script>

<template>
  <div class="account-menu-popover">
    <span ref="anchor" class="account-menu-popover__trigger">
      <slot :open="open" :toggle="toggle" />
    </span>
    <CdxPopover
      v-model:open="open"
      :anchor="anchor"
      placement="bottom-end"
      class="account-menu-popover__overlay"
    >
      <AccountMenuPanel @click.stop @create-account="onCreateAccount" @log-in="onLogIn" />
    </CdxPopover>
  </div>
</template>

<style scoped>
.account-menu-popover {
  display: inline-flex;
  flex-shrink: 0;
}

.account-menu-popover__trigger {
  display: inline-flex;
}
</style>

<!-- Teleported popover: drop the body padding so menu rows sit flush. -->
<style>
.account-menu-popover__overlay .cdx-popover__body {
  padding: 0;
}
</style>
