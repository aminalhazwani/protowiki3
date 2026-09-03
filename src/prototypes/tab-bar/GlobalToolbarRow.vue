<script setup lang="ts">
import { computed, ref } from 'vue'
import type { ComponentPublicInstance } from 'vue'
import { CdxButton, CdxIcon } from '@wikimedia/codex'
import { cdxIconClear, cdxIconDraggableVertical, cdxIconExpand } from '@wikimedia/codex-icons'

import { iconLabelFromName, resolveCodexIcon } from './codexIconCatalog'
import type { CodexIconName } from './codexIconCatalog'
import DestinationLookup from './DestinationLookup.vue'
import IconPickerMenu from './IconPickerMenu.vue'
import type { GlobalSlot } from './toolbarStore'

interface Props {
  row: GlobalSlot
  lang: string
  dragging?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  dragging: false,
})

const emit = defineEmits<{
  'update:icon': [icon: CodexIconName | null]
  'update:destination': [destination: string]
  clear: []
  gripPointerdown: [event: PointerEvent]
  gripKeydown: [event: KeyboardEvent]
}>()

const pickerOpen = ref(false)
const rowEl = ref<HTMLElement | null>(null)
const controlsEl = ref<HTMLElement | null>(null)
const iconButton = ref<ComponentPublicInstance | null>(null)
const iconButtonEl = computed<HTMLElement | null>(
  () => (iconButton.value?.$el as HTMLElement) ?? null,
)
const picker = ref<InstanceType<typeof IconPickerMenu>>()

/** Escape closes the icon menu only; stop it before the dialog's own Escape handler. */
function onControlsKeyup(event: KeyboardEvent): void {
  if (event.key === 'Escape' && pickerOpen.value) {
    event.stopPropagation()
    pickerOpen.value = false
  }
}

function onIconButtonKeydown(event: KeyboardEvent): void {
  if (!pickerOpen.value) return
  picker.value?.delegateKeyNavigation(event)
}

/** Focus moving to another control in the row (lookup, clear, grip) dismisses the picker. */
function onRowFocusIn(event: FocusEvent): void {
  if (!pickerOpen.value) return
  const button = iconButton.value?.$el as HTMLElement | undefined
  if (button && event.target instanceof Node && button.contains(event.target)) return
  pickerOpen.value = false
}

const resolvedIcon = computed(() => resolveCodexIcon(props.row.icon))
const iconLabel = computed(() => (props.row.icon ? iconLabelFromName(props.row.icon) : ''))
const isEmpty = computed(() => !props.row.icon && !props.row.destination)
</script>

<template>
  <div
    ref="rowEl"
    class="toolbar-row toolbar-row--global"
    :class="{ 'toolbar-row--dragging': dragging }"
    @focusin="onRowFocusIn"
  >
    <CdxButton
      weight="quiet"
      class="toolbar-row__grip"
      aria-label="Drag to reorder"
      @pointerdown="emit('gripPointerdown', $event)"
      @keydown="emit('gripKeydown', $event)"
    >
      <CdxIcon :icon="cdxIconDraggableVertical" />
    </CdxButton>

    <!-- One wrapper from the icon select to the clear button: the icon menu hangs from it
         and takes its full width. -->
    <div ref="controlsEl" class="toolbar-row__controls" @keyup="onControlsKeyup">
      <CdxButton
        ref="iconButton"
        class="toolbar-row__icon-button"
        :class="{ 'toolbar-row__icon-button--empty': !resolvedIcon }"
        :aria-label="resolvedIcon ? `Icon: ${iconLabel}` : 'Choose an icon'"
        :aria-expanded="pickerOpen"
        aria-haspopup="listbox"
        @click="pickerOpen = !pickerOpen"
        @keydown="onIconButtonKeydown"
      >
        <CdxIcon v-if="resolvedIcon" :icon="resolvedIcon" />
        <CdxIcon :icon="cdxIconExpand" size="small" />
      </CdxButton>

      <DestinationLookup
        :model-value="row.destination"
        :lang="lang"
        @update:model-value="emit('update:destination', $event)"
      />

      <CdxButton
        weight="quiet"
        class="toolbar-row__clear"
        aria-label="Clear"
        :disabled="isEmpty"
        @click="emit('clear')"
      >
        <CdxIcon :icon="cdxIconClear" />
      </CdxButton>

      <IconPickerMenu
        ref="picker"
        v-model:expanded="pickerOpen"
        :reference="controlsEl"
        :toggle="iconButtonEl"
        :selected="row.icon"
        @select="emit('update:icon', $event)"
      />
    </div>
  </div>
</template>
