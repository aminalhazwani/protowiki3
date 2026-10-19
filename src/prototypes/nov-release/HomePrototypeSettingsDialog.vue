<script setup lang="ts">
/**
 * "Prototype settings", opened from the ☰ menu: each setting is a closed
 * accordion section, starting with the Home layout (once its own dialog).
 */
import { CdxAccordion } from '@wikimedia/codex'

import HomeDialogShell from './HomeDialogShell.vue'
import HomeLayoutList from './HomeLayoutList.vue'

const open = defineModel<boolean>('open', { required: true })
</script>

<template>
  <HomeDialogShell v-model:open="open" title="Prototype settings" fixed-height>
    <CdxAccordion>
      <template #title>Home layout</template>
      <template #description>Drag to rearrange sections</template>
      <HomeLayoutList />
    </CdxAccordion>
  </HomeDialogShell>
</template>
