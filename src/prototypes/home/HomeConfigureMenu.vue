<script setup lang="ts">
/** A personal module's "…" menu (home2): "Configure" opens Personalization. */
import { ref, watch } from 'vue'
import { CdxIcon, CdxMenuButton } from '@wikimedia/codex'
import type { MenuButtonItemData, MenuItemValue } from '@wikimedia/codex'
import { cdxIconConfigure, cdxIconEllipsis } from '@wikimedia/codex-icons'

import { useHomePersonalization } from './useHomePersonalization'

const ITEMS: MenuButtonItemData[] = [
  { value: 'configure', label: 'Configure', icon: cdxIconConfigure },
]

const { open } = useHomePersonalization()

// A pick runs its action; clear it so no row stays selected.
const selected = ref<MenuItemValue | null>(null)
watch(selected, (value) => {
  if (value === null) return
  selected.value = null
  if (value === 'configure') open.value = true
})
</script>

<template>
  <CdxMenuButton
    v-model:selected="selected"
    class="home-configure-menu"
    :menu-items="ITEMS"
    weight="quiet"
    aria-label="Module actions"
  >
    <CdxIcon :icon="cdxIconEllipsis" />
  </CdxMenuButton>
</template>
