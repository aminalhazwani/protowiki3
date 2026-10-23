<script setup lang="ts">
/**
 * A tab's icon picker (from the `tab-bar` branch): every Codex icon as a grid,
 * in a Codex menu hung from the row's controls and as wide as them.
 */
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { CdxIcon, CdxMenu, useFloatingMenu } from '@wikimedia/codex'
import type { MenuItemData, MenuItemValue } from '@wikimedia/codex'

import { ICON_CATALOG } from './data/codexIcons'

interface Props {
  expanded: boolean
  /** Element the menu hangs from and takes its width from. */
  reference: HTMLElement | null
  /** Element whose clicks must not count as “outside” (the toggle button). */
  toggle: HTMLElement | null
  selected: string | null
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'update:expanded': [expanded: boolean]
  select: [name: string]
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
    class="home-icon-picker-menu"
    :expanded="expanded"
    :selected="selected"
    :menu-items="ICON_MENU_ITEMS"
    @update:expanded="emit('update:expanded', $event)"
    @update:selected="onSelected"
  >
    <template #default="{ menuItem }">
      <span class="home-icon-picker-menu__cell" :title="String(menuItem.label ?? '')">
        <CdxIcon :icon="menuItem.icon!" />
      </span>
    </template>
  </CdxMenu>
</template>

<!-- Unscoped: Vue's scope attribute doesn't reach the menu's inner elements. -->
<style>
.home-icon-picker-menu.cdx-menu {
  box-sizing: border-box;
}

/* CODEX+ CdxMenu: no grid layout. Icons as a grid instead of a vertical list. */
.home-icon-picker-menu .cdx-menu__listbox {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(40px, 1fr));
  gap: 2px;
  box-sizing: border-box;
  max-height: 320px;
  padding: var(--spacing-25, 4px);
}

.home-icon-picker-menu .cdx-menu-item {
  padding: 0;
  border-radius: var(--border-radius-base, 2px);
}

.home-icon-picker-menu .cdx-menu-item__content {
  justify-content: center;
  min-height: 40px;
}

.home-icon-picker-menu__cell {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 40px;
}
</style>
