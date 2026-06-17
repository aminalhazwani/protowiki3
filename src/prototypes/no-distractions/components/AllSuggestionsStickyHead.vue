<script setup lang="ts">
import { computed } from 'vue'
import { CdxIcon } from '@wikimedia/codex'
import { cdxIconConfigure } from '@wikimedia/codex-icons'

import SuggestedEditsModeMenu, { type MenuModule } from './SuggestedEditsModeMenu.vue'
import type { FlowState } from '../data/useFlowState'

const props = defineProps<{
  flow: FlowState
}>()

const emit = defineEmits<{
  configure: []
}>()

const activeModule = computed<MenuModule>(() => {
  if (props.flow.screen.value === 'featured') return 'featured'
  if (props.flow.screen.value === 'trending') return 'trending'
  return props.flow.module.value
})
</script>

<template>
  <header class="all-suggestions-sticky-head">
    <div class="all-suggestions-sticky-head__spacer" aria-hidden="true" />
    <SuggestedEditsModeMenu
      :flow="flow"
      :active-module="activeModule"
      @configure="emit('configure')"
    />
    <button
      class="all-suggestions-sticky-head__icon-btn"
      type="button"
      aria-label="Configure interests"
      @click="emit('configure')"
    >
      <CdxIcon :icon="cdxIconConfigure" />
    </button>
  </header>
</template>

<style scoped>
.all-suggestions-sticky-head {
  position: sticky;
  top: 0;
  z-index: 20;
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  align-items: center;
  box-sizing: border-box;
  min-height: 2rem;
  padding: var(--spacing-100, 16px);
  background-color: var(--background-color-base);
}

.all-suggestions-sticky-head__spacer {
  width: 2rem;
  height: 2rem;
}

.all-suggestions-sticky-head__icon-btn {
  justify-self: end;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 2rem;
  height: 2rem;
  padding: var(--spacing-25, 4px);
  border: none;
  border-radius: var(--border-radius-base, 2px);
  background: transparent;
  color: var(--color-base);
  cursor: pointer;
}

.all-suggestions-sticky-head__icon-btn :deep(.cdx-icon) {
  width: 1.25rem;
  height: 1.25rem;
}
</style>
