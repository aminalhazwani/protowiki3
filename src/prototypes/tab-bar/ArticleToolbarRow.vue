<script setup lang="ts">
import { computed } from 'vue'
import { CdxButton, CdxIcon, CdxSelect } from '@wikimedia/codex'
import type { MenuItemValue } from '@wikimedia/codex'
import { cdxIconClear, cdxIconDraggableVertical } from '@wikimedia/codex-icons'

import { ARTICLE_FEATURE_MENU_ITEMS } from './articleFeatures'
import type { ArticleFeatureId } from './articleFeatures'
import type { ArticleSlot } from './toolbarStore'

interface Props {
  row: ArticleSlot
  /** Features chosen by the other rows — disabled here to avoid duplicates. */
  usedElsewhere: ArticleFeatureId[]
  dragging?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  dragging: false,
})

const emit = defineEmits<{
  'update:feature': [feature: ArticleFeatureId | null]
  clear: []
  gripPointerdown: [event: PointerEvent]
  gripKeydown: [event: KeyboardEvent]
}>()

const menuItems = computed(() =>
  ARTICLE_FEATURE_MENU_ITEMS.map((item) => ({
    ...item,
    disabled: props.usedElsewhere.includes(item.value as ArticleFeatureId),
  })),
)

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
      :menu-items="menuItems"
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
