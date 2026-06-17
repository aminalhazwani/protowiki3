<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import {
  CdxIcon,
  CdxMenuButton,
  type MenuGroupData,
  type MenuItemData,
  type MenuItemValue,
} from '@wikimedia/codex'
import {
  cdxIconBook,
  cdxIconCheckAll,
  cdxIconDownTriangle,
  cdxIconEdit,
  cdxIconSettings,
} from '@wikimedia/codex-icons'

import type { FlowState, Module } from '../data/useFlowState'

export type MenuModule = Module | 'featured' | 'trending'

const props = defineProps<{
  flow: FlowState
  activeModule: MenuModule
}>()

const emit = defineEmits<{
  configure: []
}>()

const selected = ref<MenuItemValue>(props.activeModule)

watch(
  () => props.activeModule,
  (module) => {
    selected.value = module
  },
  { immediate: true },
)

const moduleLabel = computed(() => {
  switch (props.activeModule) {
    case 'recent-changes':
      return 'Recent changes'
    case 'featured':
      return 'Featured'
    case 'trending':
      return 'Trending'
    default:
      return 'Suggested edits'
  }
})

const menuItems: MenuGroupData[] = [
  {
    label: 'Modes',
    hideLabel: true,
    items: [
      { value: 'all', label: 'All', icon: cdxIconCheckAll },
      { value: 'read', label: 'Read', icon: cdxIconBook },
      { value: 'edit', label: 'Edit', icon: cdxIconEdit },
    ],
  },
  {
    label: 'Home modules',
    hideLabel: true,
    items: [
      { value: 'featured', label: 'Featured' },
      { value: 'trending', label: 'Trending' },
    ],
  },
  {
    label: 'Edit modules',
    hideLabel: true,
    items: [
      { value: 'suggested-edits', label: 'Suggested edits' },
      { value: 'recent-changes', label: 'Recent changes' },
    ],
  },
]

const footer: MenuItemData = {
  value: 'settings',
  label: 'Settings',
  icon: cdxIconSettings,
}

function onSelect(value: MenuItemValue | MenuItemValue[] | null): void {
  if (value === 'settings') {
    emit('configure')
  } else if (value === 'recent-changes') {
    void props.flow.goTo('all', { module: 'recent-changes' })
  } else if (value === 'suggested-edits') {
    void props.flow.goTo('all', { module: 'suggested-edits' })
  } else if (value === 'featured') {
    void props.flow.goTo('featured')
  } else if (value === 'trending') {
    void props.flow.goTo('trending')
  } else if (value === 'all') {
    void props.flow.goTo('home')
  } else if (value === 'read') {
    void props.flow.goTo('read')
  }
  selected.value = props.activeModule
}
</script>

<template>
  <CdxMenuButton
    v-model:selected="selected"
    class="suggested-edits-mode-menu"
    weight="quiet"
    :menu-items="menuItems"
    :menu-config="{ renderInPlace: true }"
    :footer="footer"
    aria-label="Home module"
    @update:selected="onSelect"
  >
    {{ moduleLabel }}
    <CdxIcon class="suggested-edits-mode-menu__chevron" :icon="cdxIconDownTriangle" />
  </CdxMenuButton>
</template>

<style scoped>
.suggested-edits-mode-menu :deep(.cdx-button) {
  gap: var(--spacing-25, 4px);
  font-family:
    var(--font-family-system-sans, system-ui, sans-serif), var(--font-family-base, sans-serif);
  font-size: var(--font-size-large, 1.125rem);
  font-weight: var(--font-weight-bold);
  line-height: var(--line-height-large, 1.56);
}

.suggested-edits-mode-menu__chevron :deep(.cdx-icon) {
  width: 0.75rem;
  height: 0.75rem;
}

/* Codex adds a group divider on every group wrapper; drop the redundant top one. */
.suggested-edits-mode-menu :deep(.cdx-menu__group-wrapper:first-child) {
  border-top: none;
}
</style>
