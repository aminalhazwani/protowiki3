<script setup lang="ts">
/**
 * A module's "…" menu, beside its heading. Empty for now: "Configure" moved to
 * ☰ Prototype settings, and the module actions are still to come.
 */
import { CdxIcon, CdxMenuButton } from '@wikimedia/codex'
import type { MenuButtonItemData } from '@wikimedia/codex'
import { cdxIconEllipsis } from '@wikimedia/codex-icons'

const ITEMS: MenuButtonItemData[] = []
</script>

<template>
  <CdxMenuButton
    :selected="null"
    class="home-module-menu"
    :menu-items="ITEMS"
    weight="quiet"
    aria-label="Module actions"
  >
    <CdxIcon :icon="cdxIconEllipsis" />
  </CdxMenuButton>
</template>
