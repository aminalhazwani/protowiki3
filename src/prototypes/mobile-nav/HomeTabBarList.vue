<script setup lang="ts">
/**
 * "Mobile tab bar" in Prototype settings (the `tab-bar` branch's global
 * toolbar editor): Home first and fixed, then the editable tabs, each with an
 * icon and a destination, reordered by dragging. Edits save as they're made.
 */
import { ref } from 'vue'
import { CdxButton, CdxIcon, CdxTextInput } from '@wikimedia/codex'
import { cdxIconExpand, cdxIconHome } from '@wikimedia/codex-icons'

import { useConfig } from '@/composables/useConfig'

import HomeTabBarRow from './HomeTabBarRow.vue'
import { useDragReorder } from './useDragReorder'
import { useHomeTabBar } from './useHomeTabBar'

const { lang } = useConfig()
const { slots, setIcon, setDestination, clear, move } = useHomeTabBar()

const list = ref<HTMLElement | null>(null)
const { dragging, onPointerDown, onKeydown } = useDragReorder(
  list,
  '.home-tab-bar-row__handle',
  move,
)
</script>

<template>
  <div class="home-tab-bar-list">
    <div class="home-tab-bar-list__row home-tab-bar-list__header" aria-hidden="true">
      <span />
      <span>Icon</span>
      <span>Destination</span>
    </div>

    <!-- Home is fixed: no handle, no clear, and its controls are disabled. -->
    <div class="home-tab-bar-list__row">
      <span />
      <CdxButton class="home-tab-bar-list__home-icon" disabled aria-label="Icon: Home">
        <CdxIcon :icon="cdxIconHome" />
        <CdxIcon :icon="cdxIconExpand" size="small" />
      </CdxButton>
      <CdxTextInput model-value="Special:Home" disabled aria-label="Home destination" />
    </div>

    <!-- No long-press menu on touch: it would cut a drag short. -->
    <div ref="list" class="home-tab-bar-list__tabs" @contextmenu.capture.prevent>
      <HomeTabBarRow
        v-for="(tab, index) in slots"
        :key="tab.id"
        :tab="tab"
        :lang="lang"
        :dragging="dragging === index"
        @update:icon="setIcon(tab.id, $event)"
        @update:destination="setDestination(tab.id, $event)"
        @clear="clear(index)"
        @handle-pointerdown="onPointerDown($event, index)"
        @handle-keydown="onKeydown($event, index)"
      />
    </div>
  </div>
</template>

<style scoped>
.home-tab-bar-list,
.home-tab-bar-list__tabs {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-50);
}

/* The editable rows' columns (`HomeTabBarRow`): handle, icon, destination, clear. */
.home-tab-bar-list__row {
  display: grid;
  grid-template-columns: var(--size-200) var(--size-300) minmax(0, 1fr) var(--size-200);
  align-items: center;
  gap: var(--spacing-50);
}

.home-tab-bar-list__header {
  font-weight: var(--font-weight-bold);
  line-height: var(--line-height-small);
}

/* As the editable rows' icon button: the icon at the start, the chevron at the end. */
.home-tab-bar-list__home-icon.cdx-button {
  min-width: 0;
  width: var(--size-300);
  padding-inline: var(--spacing-25);
  gap: 0;
  justify-content: space-between;
}

/* CODEX+ CdxTextInput: a 256px minimum width, which overflows a dialog row. */
.home-tab-bar-list__row :deep(.cdx-text-input) {
  min-width: 0;
}
</style>
