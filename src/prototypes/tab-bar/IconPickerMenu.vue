<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { CdxIcon, CdxMenu, useFloatingMenu } from '@wikimedia/codex'
import type { MenuItemData, MenuItemValue } from '@wikimedia/codex'

import { ICON_CATALOG } from './codexIconCatalog'
import type { CodexIconName } from './codexIconCatalog'

interface Props {
  expanded: boolean
  /** Element the menu hangs from and takes its width from. */
  reference: HTMLElement | null
  /** Element whose clicks must not count as “outside” (the toggle button). */
  toggle: HTMLElement | null
  selected: CodexIconName | null
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'update:expanded': [expanded: boolean]
  select: [name: CodexIconName]
}>()

const ICON_MENU_ITEMS: MenuItemData[] = ICON_CATALOG.map((entry) => ({
  value: entry.name,
  label: entry.label,
  icon: entry.icon,
}))

const menu = ref<InstanceType<typeof CdxMenu>>()
const referenceRef = computed(() => props.reference ?? undefined)

// Same positioning Codex selects use: below the reference, matching its width, flipping up when needed.
useFloatingMenu(referenceRef, menu, { placement: 'bottom-start', offset: 4 })

function close(): void {
  emit('update:expanded', false)
}

function onSelected(value: MenuItemValue | null): void {
  if (value === null || value === undefined) return
  emit('select', String(value))
  close()
}

function onDocumentMousedown(event: MouseEvent): void {
  const target = event.target
  if (!(target instanceof Node)) return
  // `$el` is not reliable for CdxMenu; Codex exposes the root element explicitly.
  const menuRoot = menu.value?.getRootElement() ?? null
  if (menuRoot?.contains(target) || props.toggle?.contains(target)) return
  close()
}

watch(
  () => props.expanded,
  (expanded) => {
    document.removeEventListener('mousedown', onDocumentMousedown, true)
    if (expanded) document.addEventListener('mousedown', onDocumentMousedown, true)
  },
  { immediate: true },
)

onBeforeUnmount(() => {
  document.removeEventListener('mousedown', onDocumentMousedown, true)
})

/** Lets the toggle button drive arrow-key navigation inside the menu. */
function delegateKeyNavigation(event: KeyboardEvent): boolean {
  return menu.value?.delegateKeyNavigation(event) ?? false
}

defineExpose({ delegateKeyNavigation })
</script>

<template>
  <CdxMenu
    ref="menu"
    class="icon-picker-menu"
    :expanded="expanded"
    :selected="selected"
    :menu-items="ICON_MENU_ITEMS"
    @update:expanded="emit('update:expanded', $event)"
    @update:selected="onSelected"
  >
    <template #default="{ menuItem }">
      <span class="icon-picker-menu__cell" :title="String(menuItem.label ?? '')">
        <CdxIcon :icon="menuItem.icon!" />
      </span>
    </template>
  </CdxMenu>
</template>

<style>
/* Unscoped on purpose: Vue's scope attribute does not reach the menu's inner elements. */
.icon-picker-menu.cdx-menu {
  box-sizing: border-box;
}

/* Icons as a grid instead of a vertical list. */
.icon-picker-menu .cdx-menu__listbox {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(40px, 1fr));
  gap: 2px;
  box-sizing: border-box;
  max-height: 320px;
  padding: var(--spacing-25, 4px);
}

.icon-picker-menu .cdx-menu-item {
  padding: 0;
  border-radius: var(--border-radius-base, 2px);
}

.icon-picker-menu .cdx-menu-item__content {
  justify-content: center;
  min-height: 40px;
}

.icon-picker-menu__cell {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 40px;
}
</style>
