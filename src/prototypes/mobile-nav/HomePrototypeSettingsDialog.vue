<script setup lang="ts">
/**
 * "Prototype settings", opened from the ☰ menu: each setting is a closed
 * accordion section — the Home layout and Personalization (each once its own
 * dialog), the mobile tab bar, and the main menu's Advanced mode.
 */
import { CdxAccordion, CdxToggleSwitch } from '@wikimedia/codex'

import HomeDialogShell from './HomeDialogShell.vue'
import HomeLayoutList from './HomeLayoutList.vue'
import HomePersonalizationList from './HomePersonalizationList.vue'
import HomeTabBarList from './HomeTabBarList.vue'
import { useHomeAdvancedMode } from './useHomeAdvancedMode'

const open = defineModel<boolean>('open', { required: true })
const { advancedMode } = useHomeAdvancedMode()
</script>

<template>
  <HomeDialogShell v-model:open="open" title="Prototype settings" fixed-height>
    <CdxAccordion>
      <template #title>Home layout</template>
      <template #description>Drag to rearrange sections</template>
      <HomeLayoutList />
    </CdxAccordion>
    <CdxAccordion>
      <template #title>Personalization</template>
      <template #description>Choose which activity shapes the recommendations on your Home</template>
      <HomePersonalizationList />
    </CdxAccordion>
    <CdxAccordion>
      <template #title>Mobile tab bar</template>
      <template #description>Drag to rearrange tabs</template>
      <HomeTabBarList />
    </CdxAccordion>
    <CdxAccordion>
      <template #title>Main menu</template>
      <template #description>Mobile only</template>
      <CdxToggleSwitch v-model="advancedMode" align-switch>
        Advanced mode
        <template #description>
          Adds Recent changes, Special pages and Community portal when signed in
        </template>
      </CdxToggleSwitch>
    </CdxAccordion>
  </HomeDialogShell>
</template>
