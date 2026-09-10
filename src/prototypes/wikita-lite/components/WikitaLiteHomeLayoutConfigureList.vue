<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch, type CSSProperties } from 'vue'
import { CdxButton, CdxIcon, CdxToggleSwitch } from '@wikimedia/codex'
import { cdxIconDraggableVertical } from '@wikimedia/codex-icons'

import {
  CONFIGURABLE_HOME_MODULE_LABELS,
  type ConfigurableHomeModuleId,
} from '../data/homeLayout'

interface Props {
  order: ConfigurableHomeModuleId[]
  isEnabled: (id: ConfigurableHomeModuleId) => boolean
}

interface DragState {
  id: ConfigurableHomeModuleId
  /** Pointer Y minus the row's vertical center at drag start. */
  grabOffsetFromItemCenter: number
  rowHeight: number
  liftTop: number
  rowLeft: number
  rowWidth: number
}

/** Matches --spacing-50 on the lift; subtract from liftTop so grab position stays stable. */
const LIFT_PADDING_PX = 8

const props = defineProps<Props>()

const emit = defineEmits<{
  'update:enabled': [id: ConfigurableHomeModuleId, enabled: boolean]
  reorder: [order: ConfigurableHomeModuleId[]]
}>()

const listEl = ref<HTMLElement | null>(null)
const localOrder = ref<ConfigurableHomeModuleId[]>([...props.order])
const draggingId = ref<ConfigurableHomeModuleId | null>(null)
const dragState = ref<DragState | null>(null)

watch(
  () => props.order,
  (next) => {
    if (draggingId.value) return
    localOrder.value = [...next]
  },
)

const dragLiftStyle = computed((): CSSProperties | undefined => {
  if (!dragState.value) return undefined
  return {
    position: 'fixed',
    top: `${dragState.value.liftTop}px`,
    left: `${dragState.value.rowLeft}px`,
    width: `${dragState.value.rowWidth}px`,
    height: `${dragState.value.rowHeight + LIFT_PADDING_PX * 2}px`,
    zIndex: 1000,
    pointerEvents: 'none',
  }
})

function onToggle(id: ConfigurableHomeModuleId, enabled: boolean): void {
  emit('update:enabled', id, enabled)
}

function rowElement(id: ConfigurableHomeModuleId): HTMLElement | null {
  return listEl.value?.querySelector<HTMLElement>(`[data-module-id="${id}"]`) ?? null
}

function syncLiftAnchorFromPlaceholder(): void {
  if (!dragState.value || !draggingId.value) return
  const row = rowElement(draggingId.value)
  if (!row) return
  const rect = row.getBoundingClientRect()
  dragState.value.rowLeft = rect.left
  dragState.value.rowWidth = rect.width
}

function targetIndexForItemCenter(itemCenterY: number): number {
  const list = listEl.value
  if (!list) return -1

  const rows = list.querySelectorAll<HTMLElement>('[data-module-id]')
  for (let i = 0; i < rows.length; i++) {
    const rect = rows[i].getBoundingClientRect()
    if (itemCenterY < rect.top + rect.height / 2) return i
  }

  return rows.length - 1
}

function reorderLocal(fromId: ConfigurableHomeModuleId, toIndex: number): void {
  const fromIndex = localOrder.value.indexOf(fromId)
  if (fromIndex === -1 || toIndex === -1 || fromIndex === toIndex) return

  const next = [...localOrder.value]
  next.splice(fromIndex, 1)
  next.splice(toIndex, 0, fromId)
  localOrder.value = next
}

function setGrabbingCursor(active: boolean): void {
  if (typeof document === 'undefined') return
  document.body.style.cursor = active ? 'grabbing' : ''
}

function suppressLongPress(event: Event): void {
  event.preventDefault()
}

function onDragHandlePointerDown(id: ConfigurableHomeModuleId, event: PointerEvent): void {
  const row = (event.currentTarget as HTMLElement | null)?.closest<HTMLElement>('[data-module-id]')
  if (!row) return

  const rect = row.getBoundingClientRect()
  const rowCenterY = rect.top + rect.height / 2
  draggingId.value = id
  dragState.value = {
    id,
    grabOffsetFromItemCenter: event.clientY - rowCenterY,
    rowHeight: rect.height,
    liftTop: rowCenterY - rect.height / 2 - LIFT_PADDING_PX,
    rowLeft: rect.left,
    rowWidth: rect.width,
  }

  setGrabbingCursor(true)
  listEl.value?.setPointerCapture(event.pointerId)
  event.preventDefault()
}

function onListPointerMove(event: PointerEvent): void {
  if (!draggingId.value || !dragState.value) return

  const itemCenterY = event.clientY - dragState.value.grabOffsetFromItemCenter
  dragState.value.liftTop = itemCenterY - dragState.value.rowHeight / 2 - LIFT_PADDING_PX
  syncLiftAnchorFromPlaceholder()

  reorderLocal(draggingId.value, targetIndexForItemCenter(itemCenterY))
}

function finishDrag(event: PointerEvent): void {
  if (!draggingId.value || !dragState.value) return

  const itemCenterY = event.clientY - dragState.value.grabOffsetFromItemCenter
  reorderLocal(draggingId.value, targetIndexForItemCenter(itemCenterY))

  if (listEl.value?.hasPointerCapture(event.pointerId)) {
    listEl.value.releasePointerCapture(event.pointerId)
  }

  const committed = [...localOrder.value]
  draggingId.value = null
  dragState.value = null
  setGrabbingCursor(false)

  const unchanged =
    committed.length === props.order.length &&
    committed.every((id, index) => id === props.order[index])

  if (!unchanged) {
    emit('reorder', committed)
  }
}

onBeforeUnmount(() => setGrabbingCursor(false))
</script>

<template>
  <ul
    ref="listEl"
    class="wikita-lite-home-layout-configure-list"
    :class="{ 'wikita-lite-home-layout-configure-list--dragging': draggingId !== null }"
    @pointermove="onListPointerMove"
    @pointerup="finishDrag"
    @pointercancel="finishDrag"
    @contextmenu.capture.prevent="suppressLongPress"
  >
    <li
      v-for="moduleId in localOrder"
      :key="moduleId"
      class="wikita-lite-home-layout-configure-list__item"
      :class="{
        'wikita-lite-home-layout-configure-list__item--placeholder': draggingId === moduleId,
      }"
      :data-module-id="moduleId"
    >
      <CdxButton
        class="wikita-lite-home-layout-configure-list__handle"
        weight="quiet"
        aria-label="Drag to reorder"
        @pointerdown="onDragHandlePointerDown(moduleId, $event)"
        @touchstart.prevent="suppressLongPress"
        @contextmenu.prevent="suppressLongPress"
        @selectstart.prevent="suppressLongPress"
      >
        <CdxIcon :icon="cdxIconDraggableVertical" />
      </CdxButton>
      <CdxToggleSwitch
        class="wikita-lite-home-layout-configure-list__toggle"
        :model-value="isEnabled(moduleId)"
        align-switch
        @update:model-value="onToggle(moduleId, $event)"
      >
        {{ CONFIGURABLE_HOME_MODULE_LABELS[moduleId] }}
      </CdxToggleSwitch>
    </li>
  </ul>

  <div
    v-if="dragState && draggingId"
    class="wikita-lite-home-layout-configure-list__lift"
    :style="dragLiftStyle"
    aria-hidden="true"
  >
    <CdxButton
      class="wikita-lite-home-layout-configure-list__handle"
      weight="quiet"
      aria-hidden="true"
      tabindex="-1"
    >
      <CdxIcon :icon="cdxIconDraggableVertical" />
    </CdxButton>
    <CdxToggleSwitch
      class="wikita-lite-home-layout-configure-list__toggle"
      :model-value="isEnabled(draggingId)"
      align-switch
      disabled
    >
      {{ CONFIGURABLE_HOME_MODULE_LABELS[draggingId] }}
    </CdxToggleSwitch>
  </div>
</template>

<style scoped>
.wikita-lite-home-layout-configure-list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-50, 8px);
  margin: 0;
  padding: 0;
  list-style: none;
}

.wikita-lite-home-layout-configure-list--dragging,
.wikita-lite-home-layout-configure-list--dragging :deep(*) {
  cursor: grabbing !important;
}

.wikita-lite-home-layout-configure-list--dragging {
  touch-action: none;
  user-select: none;
}

.wikita-lite-home-layout-configure-list__item,
.wikita-lite-home-layout-configure-list__lift {
  display: flex;
  align-items: center;
  gap: var(--spacing-50, 8px);
  box-sizing: border-box;
}

.wikita-lite-home-layout-configure-list__item--placeholder {
  visibility: hidden;
}

/* Only exists while dragging. Transparent so the lift doesn't paint a slab over
   the rows it passes; the block padding is geometry only (see LIFT_PADDING_PX). */
.wikita-lite-home-layout-configure-list__lift {
  background: transparent;
  padding-block: var(--spacing-50, 8px);
}

/* Codex owns the 32px icon-only frame and the quiet hover/active fills; these
   are the drag affordances on top. The `:hover` selector is needed because
   Codex's own `.cdx-button:enabled:hover` sets `cursor: pointer`. */
.wikita-lite-home-layout-configure-list__handle {
  flex-shrink: 0;
  touch-action: none;
  -webkit-touch-callout: none;
  -webkit-user-select: none;
  user-select: none;
}

.wikita-lite-home-layout-configure-list__handle,
.wikita-lite-home-layout-configure-list__handle:enabled:hover {
  cursor: grab;
}

/* Keep hits on the handle surface, not the icon SVG (avoids browser long-press menus). */
.wikita-lite-home-layout-configure-list__handle :deep(*) {
  pointer-events: none;
  -webkit-touch-callout: none;
  user-select: none;
}

.wikita-lite-home-layout-configure-list__handle:enabled:active {
  cursor: grabbing;
}

.wikita-lite-home-layout-configure-list__toggle {
  flex: 1;
  min-width: 0;
}

.wikita-lite-home-layout-configure-list__toggle :deep(.cdx-toggle-switch) {
  width: 100%;
}
</style>
