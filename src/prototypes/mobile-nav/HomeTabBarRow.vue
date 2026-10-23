<script setup lang="ts">
/**
 * One editable tab in "Mobile tab bar" (the `tab-bar` branch's global toolbar
 * row): a drag handle, then the icon picker, the destination and a clear
 * button, grouped so the icon menu hangs from all three and takes their width.
 */
import { computed, ref, type ComponentPublicInstance } from 'vue'
import { CdxButton, CdxIcon } from '@wikimedia/codex'
import { cdxIconClear, cdxIconDraggableVertical, cdxIconExpand } from '@wikimedia/codex-icons'

import { iconLabelFromName, resolveCodexIcon } from './data/codexIcons'
import type { HomeTabSlot } from './data/tabBar'
import HomeDestinationLookup from './HomeDestinationLookup.vue'
import HomeIconPickerMenu from './HomeIconPickerMenu.vue'

const props = withDefaults(defineProps<{ tab: HomeTabSlot; lang: string; dragging?: boolean }>(), {
  dragging: false,
})

const emit = defineEmits<{
  'update:icon': [icon: string]
  'update:destination': [destination: string]
  clear: []
  handlePointerdown: [event: PointerEvent]
  handleKeydown: [event: KeyboardEvent]
}>()

const pickerOpen = ref(false)
const controls = ref<HTMLElement | null>(null)
const iconButton = ref<ComponentPublicInstance | null>(null)
const iconButtonEl = computed(() => (iconButton.value?.$el as HTMLElement | undefined) ?? null)
const picker = ref<InstanceType<typeof HomeIconPickerMenu>>()

const icon = computed(() => resolveCodexIcon(props.tab.icon))
const iconLabel = computed(() => (props.tab.icon ? iconLabelFromName(props.tab.icon) : ''))
const isEmpty = computed(() => !props.tab.icon && !props.tab.destination)

/** Escape closes the icon menu only: stop it before the dialog's own Escape closes that. */
function onControlsKeyup(event: KeyboardEvent): void {
  if (event.key === 'Escape' && pickerOpen.value) {
    event.stopPropagation()
    pickerOpen.value = false
  }
}

/** Arrow keys on the icon button move through the open menu. */
function onIconButtonKeydown(event: KeyboardEvent): void {
  if (pickerOpen.value) picker.value?.delegateKeyNavigation(event)
}

/** Focus moving to another control in the row (destination, clear, handle) closes the picker. */
function onFocusIn(event: FocusEvent): void {
  if (!pickerOpen.value) return
  if (event.target instanceof Node && iconButtonEl.value?.contains(event.target)) return
  pickerOpen.value = false
}
</script>

<template>
  <div
    class="home-tab-bar-row"
    :class="{ 'home-tab-bar-row--dragging': dragging }"
    @focusin="onFocusIn"
  >
    <CdxButton
      class="home-tab-bar-row__handle"
      weight="quiet"
      aria-label="Drag to reorder"
      @pointerdown="emit('handlePointerdown', $event)"
      @keydown="emit('handleKeydown', $event)"
    >
      <CdxIcon :icon="cdxIconDraggableVertical" />
    </CdxButton>

    <div ref="controls" class="home-tab-bar-row__controls" @keyup="onControlsKeyup">
      <CdxButton
        ref="iconButton"
        class="home-tab-bar-row__icon"
        :class="{ 'home-tab-bar-row__icon--empty': !icon }"
        :aria-label="icon ? `Icon: ${iconLabel}` : 'Choose an icon'"
        :aria-expanded="pickerOpen"
        aria-haspopup="listbox"
        @click="pickerOpen = !pickerOpen"
        @keydown="onIconButtonKeydown"
      >
        <CdxIcon v-if="icon" :icon="icon" />
        <CdxIcon :icon="cdxIconExpand" size="small" />
      </CdxButton>

      <HomeDestinationLookup
        :model-value="tab.destination"
        :lang="lang"
        @update:model-value="emit('update:destination', $event)"
      />

      <CdxButton
        class="home-tab-bar-row__clear"
        weight="quiet"
        aria-label="Clear"
        :disabled="isEmpty"
        @click="emit('clear')"
      >
        <CdxIcon :icon="cdxIconClear" />
      </CdxButton>

      <HomeIconPickerMenu
        ref="picker"
        v-model:expanded="pickerOpen"
        :reference="controls"
        :toggle="iconButtonEl"
        :selected="tab.icon"
        @select="emit('update:icon', $event)"
      />
    </div>
  </div>
</template>

<style scoped>
/* Columns shared with the list's header and Home rows (`HomeTabBarList`). */
.home-tab-bar-row {
  display: grid;
  grid-template-columns: var(--size-200) minmax(0, 1fr);
  align-items: center;
  gap: var(--spacing-50);
  background-color: var(--background-color-base);
}

/* While dragging, the row floats over its neighbours, which show through. */
.home-tab-bar-row--dragging {
  position: relative;
  z-index: 1;
  background-color: transparent;
}

.home-tab-bar-row__controls {
  display: grid;
  grid-template-columns: var(--size-300) minmax(0, 1fr) var(--size-200);
  align-items: center;
  gap: var(--spacing-50);
}

/* The handle takes the touch itself: no scrolling, callout or text selection. */
.home-tab-bar-row__handle {
  touch-action: none;
  -webkit-touch-callout: none;
  user-select: none;
}

/* Codex's `:enabled:hover` sets `cursor: pointer`, hence the second selector. */
.home-tab-bar-row__handle,
.home-tab-bar-row__handle:enabled:hover {
  cursor: grab;
}

.home-tab-bar-row--dragging .home-tab-bar-row__handle {
  cursor: grabbing;
}

.home-tab-bar-row__handle :deep(*) {
  pointer-events: none;
}

/* A select-like button: the tab's icon at the start, the chevron at the end. */
.home-tab-bar-row__icon.cdx-button {
  min-width: 0;
  width: var(--size-300);
  padding-inline: var(--spacing-25);
  gap: 0;
  justify-content: space-between;
}

.home-tab-bar-row__icon--empty.cdx-button {
  justify-content: flex-end;
}

/* CODEX+ CdxTextInput: a 256px minimum width, which overflows a dialog row. */
.home-tab-bar-row__controls :deep(.cdx-lookup),
.home-tab-bar-row__controls :deep(.cdx-text-input) {
  min-width: 0;
}
</style>
