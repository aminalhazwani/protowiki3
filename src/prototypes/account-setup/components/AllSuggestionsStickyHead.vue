<script setup lang="ts">
import { computed, ref } from 'vue'
import { CdxButton, CdxIcon } from '@wikimedia/codex'
import { cdxIconConfigure, cdxIconFilter } from '@wikimedia/codex-icons'

import SuggestedEditsFilterSheet from './SuggestedEditsFilterSheet.vue'
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

const filterOpen = ref(false)
</script>

<template>
  <header class="all-suggestions-sticky-head">
    <CdxButton
      weight="quiet"
      size="medium"
      aria-label="Filter suggestions"
      @click="filterOpen = true"
    >
      <CdxIcon :icon="cdxIconFilter" />
    </CdxButton>
    <SuggestedEditsModeMenu
      :flow="flow"
      :active-module="activeModule"
      @configure="emit('configure')"
    />
    <CdxButton
      weight="quiet"
      size="medium"
      aria-label="Configure interests"
      @click="emit('configure')"
    >
      <CdxIcon :icon="cdxIconConfigure" />
    </CdxButton>
  </header>
  <SuggestedEditsFilterSheet v-model:open="filterOpen" />
</template>

<style scoped>
.all-suggestions-sticky-head {
  position: sticky;
  top: 0;
  z-index: 20;
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-sizing: border-box;
  min-height: 2rem;
  padding: var(--spacing-100, 16px);
  background-color: var(--background-color-base);
}

</style>
