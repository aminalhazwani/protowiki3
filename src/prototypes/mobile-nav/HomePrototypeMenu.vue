<script setup lang="ts">
/**
 * The header's ☰ menu on Vector: "Prototype settings" (a dialog holding the
 * Home layout), and home2's "Reset prototype", for starting a test session
 * over, as the menu's footer in the destructive (error) colour. Minerva gets
 * the main menu drawer instead (`HomeMainMenu`).
 */
import { ref, watch } from 'vue'
import {
  CdxIcon,
  CdxMenuButton,
  type MenuButtonItemData,
  type MenuItemValue,
} from '@wikimedia/codex'
import { cdxIconMenu } from '@wikimedia/codex-icons'

import HomePrototypeSettingsDialog from './HomePrototypeSettingsDialog.vue'
import { useHomeResetPrototype } from './useHomeResetPrototype'

const MENU_ITEMS: MenuButtonItemData[] = [{ value: 'settings', label: 'Prototype settings' }]
const MENU_FOOTER: MenuButtonItemData = {
  value: 'reset',
  label: 'Reset prototype',
  action: 'destructive',
}

const { resetPrototype } = useHomeResetPrototype()
const selected = ref<MenuItemValue | null>(null)
const settingsOpen = ref(false)

watch(selected, (value) => {
  if (value === null) return
  selected.value = null
  if (value === 'settings') settingsOpen.value = true
  if (value === 'reset') resetPrototype()
})
</script>

<template>
  <CdxMenuButton
    v-model:selected="selected"
    class="prototype-chrome-menu-popover"
    :menu-items="MENU_ITEMS"
    :footer="MENU_FOOTER"
    weight="quiet"
    aria-label="Main menu"
  >
    <CdxIcon :icon="cdxIconMenu" />
  </CdxMenuButton>
  <HomePrototypeSettingsDialog v-model:open="settingsOpen" />
</template>

<style scoped>
/*
 * CODEX+ CdxMenu: the footer's height is measured once, when the menu opens at
 * the trigger's narrow width (Floating UI widens it a moment later). "Reset
 * prototype" wraps there, so the list keeps a two-line gap above the footer.
 * Sizing the menu to its rows from the start makes that first measure right.
 */
.prototype-chrome-menu-popover :deep(.cdx-menu) {
  min-width: max-content;
}
</style>
