<script setup lang="ts">
import { computed, ref } from 'vue'
import type { ComponentPublicInstance } from 'vue'
import { CdxButton, CdxIcon } from '@wikimedia/codex'
import { cdxIconClear, cdxIconDraggableVertical, cdxIconExpand } from '@wikimedia/codex-icons'

import { iconLabelFromName, resolveCodexIcon } from './codexIconCatalog'
import type { CodexIconName } from './codexIconCatalog'
import DestinationLookup from './DestinationLookup.vue'
import IconPickerPopover from './IconPickerPopover.vue'
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
const iconButton = ref<ComponentPublicInstance | null>(null)
const anchor = computed<HTMLElement | null>(() => (iconButton.value?.$el as HTMLElement) ?? null)

const resolvedIcon = computed(() => resolveCodexIcon(props.row.icon))
const iconLabel = computed(() => (props.row.icon ? iconLabelFromName(props.row.icon) : ''))
const isEmpty = computed(() => !props.row.icon && !props.row.destination)
</script>

<template>
  <div class="toolbar-row toolbar-row--global" :class="{ 'toolbar-row--dragging': dragging }">
    <CdxButton
      weight="quiet"
      class="toolbar-row__grip"
      aria-label="Drag to reorder"
      @pointerdown="emit('gripPointerdown', $event)"
      @keydown="emit('gripKeydown', $event)"
    >
      <CdxIcon :icon="cdxIconDraggableVertical" />
    </CdxButton>

    <CdxButton
      ref="iconButton"
      class="toolbar-row__icon-button"
      :class="{ 'toolbar-row__icon-button--empty': !resolvedIcon }"
      :aria-label="resolvedIcon ? `Icon: ${iconLabel}` : 'Choose an icon'"
      :aria-expanded="pickerOpen"
      aria-haspopup="dialog"
      @click="pickerOpen = !pickerOpen"
    >
      <CdxIcon v-if="resolvedIcon" :icon="resolvedIcon" />
      <CdxIcon :icon="cdxIconExpand" size="small" />
    </CdxButton>
    <IconPickerPopover
      v-model:open="pickerOpen"
      :anchor="anchor"
      :selected="row.icon"
      @select="emit('update:icon', $event)"
    />

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
  </div>
</template>
