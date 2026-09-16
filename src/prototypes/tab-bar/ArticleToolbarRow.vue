<script setup lang="ts">
import { CdxButton, CdxIcon, CdxSelect } from '@wikimedia/codex'
import type { MenuItemValue } from '@wikimedia/codex'
import { cdxIconClear, cdxIconDraggableVertical } from '@wikimedia/codex-icons'

import { ARTICLE_FEATURE_MENU_ITEMS } from './articleFeatures'
import type { ArticleFeatureId } from './articleFeatures'
import type { ArticleSlot } from './toolbarStore'

interface Props {
  row: ArticleSlot
  dragging?: boolean
}

withDefaults(defineProps<Props>(), {
  dragging: false,
})

const emit = defineEmits<{
  'update:feature': [feature: ArticleFeatureId | null]
  clear: []
  gripPointerdown: [event: PointerEvent]
  gripKeydown: [event: KeyboardEvent]
}>()

function onSelected(value: MenuItemValue | null): void {
  emit('update:feature', value === null ? null : (String(value) as ArticleFeatureId))
}
</script>

<template>
  <div class="toolbar-row toolbar-row--article" :class="{ 'toolbar-row--dragging': dragging }">
    <CdxButton
      weight="quiet"
      class="toolbar-row__grip"
      aria-label="Drag to reorder"
      @pointerdown="emit('gripPointerdown', $event)"
      @keydown="emit('gripKeydown', $event)"
    >
      <CdxIcon :icon="cdxIconDraggableVertical" />
    </CdxButton>

    <CdxSelect
      class="toolbar-row__select"
      :selected="row.feature"
      :menu-items="ARTICLE_FEATURE_MENU_ITEMS"
      default-label="Choose a feature"
      @update:selected="onSelected"
    />

    <CdxButton
      weight="quiet"
      class="toolbar-row__clear"
      aria-label="Clear"
      :disabled="row.feature === null"
      @click="emit('clear')"
    >
      <CdxIcon :icon="cdxIconClear" />
    </CdxButton>
  </div>
</template>
