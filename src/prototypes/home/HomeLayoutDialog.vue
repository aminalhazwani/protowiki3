<script setup lang="ts">
/**
 * "Home layout" (home2's configure page): every module with a switch, in
 * layout order. Opened over the Home, which updates as modules are switched.
 */
import { CdxToggleSwitch } from '@wikimedia/codex'

import HomeDialogShell from './HomeDialogShell.vue'
import { layoutLabel, useHomeLayout } from './useHomeLayout'

const open = defineModel<boolean>('open', { required: true })

const { modules, isOn, setOn } = useHomeLayout()
</script>

<template>
  <!-- home2's subtitle, "Drag to rearrange sections", comes with reordering (next step). -->
  <HomeDialogShell v-model:open="open" title="Home layout">
    <ul class="home-layout-dialog__list">
      <li v-for="spec in modules" :key="spec.id">
        <CdxToggleSwitch
          :model-value="isOn(spec.id)"
          align-switch
          @update:model-value="setOn(spec.id, $event)"
        >
          {{ layoutLabel(spec) }}
        </CdxToggleSwitch>
      </li>
    </ul>
  </HomeDialogShell>
</template>

<style scoped>
.home-layout-dialog__list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-50);
  margin: 0;
  padding: 0;
  list-style: none;
}
</style>
