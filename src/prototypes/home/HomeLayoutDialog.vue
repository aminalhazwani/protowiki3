<script setup lang="ts">
/**
 * "Home layout" (home2's configure page): every module with a drag handle and
 * a switch, in layout order. Opened over the Home, which follows each change.
 */
import { ref } from 'vue'
import { CdxButton, CdxIcon, CdxToggleSwitch } from '@wikimedia/codex'
import { cdxIconDraggableVertical } from '@wikimedia/codex-icons'

import HomeDialogShell from './HomeDialogShell.vue'
import { useDragReorder } from './useDragReorder'
import { layoutLabel, useHomeLayout } from './useHomeLayout'

const open = defineModel<boolean>('open', { required: true })

const { modules, isOn, setOn, move } = useHomeLayout()

const list = ref<HTMLElement | null>(null)
const { dragging, onPointerDown, onKeydown } = useDragReorder(
  list,
  '.home-layout-dialog__handle',
  move,
)
</script>

<template>
  <HomeDialogShell v-model:open="open" title="Home layout" subtitle="Drag to rearrange sections">
    <!-- No long-press menu on touch: it would cut a drag short. -->
    <ul
      ref="list"
      class="home-layout-dialog__list"
      :class="{ 'home-layout-dialog__list--dragging': dragging !== null }"
      @contextmenu.capture.prevent
    >
      <li
        v-for="(spec, index) in modules"
        :key="spec.id"
        class="home-layout-dialog__row"
        :class="{ 'home-layout-dialog__row--dragging': dragging === index }"
      >
        <CdxButton
          class="home-layout-dialog__handle"
          weight="quiet"
          aria-label="Drag to reorder"
          @pointerdown="onPointerDown($event, index)"
          @keydown="onKeydown($event, index)"
        >
          <CdxIcon :icon="cdxIconDraggableVertical" />
        </CdxButton>
        <CdxToggleSwitch
          class="home-layout-dialog__switch"
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

/* While dragging, nothing is selectable and the whole list shows the grab. */
.home-layout-dialog__list--dragging {
  user-select: none;
}

.home-layout-dialog__list--dragging,
.home-layout-dialog__list--dragging :deep(*) {
  cursor: grabbing !important;
}

/*
 * Rows are opaque, so the ones sliding aside cover each other cleanly; the
 * dragged row rides on top, transparent, with the rows it passes showing
 * through (home2).
 */
.home-layout-dialog__row {
  display: flex;
  align-items: center;
  gap: var(--spacing-50);
  background-color: var(--background-color-base);
}

.home-layout-dialog__row--dragging {
  position: relative;
  z-index: 1;
  background-color: transparent;
}

/* The handle takes the touch itself: no scrolling, callout or text selection. */
.home-layout-dialog__handle {
  flex-shrink: 0;
  touch-action: none;
  -webkit-touch-callout: none;
  user-select: none;
}

/* Codex's `:enabled:hover` sets `cursor: pointer`, hence the second selector. */
.home-layout-dialog__handle,
.home-layout-dialog__handle:enabled:hover {
  cursor: grab;
}

.home-layout-dialog__handle :deep(*) {
  pointer-events: none;
}

/* The switch fills the rest of the row, so `align-switch` puts it at the end. */
.home-layout-dialog__switch {
  flex: 1;
  min-width: 0;
}
</style>
