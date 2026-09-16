<script setup lang="ts">
import { onBeforeUnmount, ref, watch } from 'vue'
import { CdxLookup } from '@wikimedia/codex'
import type { MenuItemData, MenuItemValue } from '@wikimedia/codex'

import { fetchPrefixSearch, toDestinationMenuItems } from './searchDestinations'

interface Props {
  /** Destination title in display form; `''` when empty. */
  modelValue: string
  /** Wikipedia language for live suggestions. */
  lang: string
  disabled?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  disabled: false,
})

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

const DEBOUNCE_MS = 250

const selected = ref<MenuItemValue | null>(props.modelValue || null)
const inputValue = ref(props.modelValue)
// Empty until people type: focusing the field opens the keyboard, not a list.
const menuItems = ref<MenuItemData[]>([])

let debounceHandle: ReturnType<typeof setTimeout> | undefined
let controller: AbortController | undefined
let latestQuery = ''

function onInput(value: string): void {
  const query = value.trim()
  latestQuery = query
  clearTimeout(debounceHandle)
  if (!query) {
    menuItems.value = []
    emit('update:modelValue', '')
    return
  }
  debounceHandle = setTimeout(() => {
    controller?.abort()
    controller = new AbortController()
    const { signal } = controller
    fetchPrefixSearch(query, { lang: props.lang, signal })
      .then((results) => {
        if (signal.aborted || latestQuery !== query) return
        menuItems.value = toDestinationMenuItems(results)
      })
      .catch(() => {
        if (!signal.aborted) menuItems.value = []
      })
  }, DEBOUNCE_MS)
}

function onSelected(value: MenuItemValue | null): void {
  if (value === null || value === undefined) return
  emit('update:modelValue', String(value))
}

/** Typed text that was never picked from the menu still becomes the destination. */
function commitTyped(): void {
  const typed = inputValue.value.trim()
  if (selected.value === null && typed && typed !== props.modelValue) {
    emit('update:modelValue', typed)
  }
}

function onEnter(): void {
  // Let a highlighted suggestion win first; commit free text otherwise.
  setTimeout(commitTyped, 0)
}

watch(
  () => props.modelValue,
  (value) => {
    if (value === inputValue.value) return
    inputValue.value = value
    selected.value = value || null
  },
)

onBeforeUnmount(() => {
  clearTimeout(debounceHandle)
  controller?.abort()
})
</script>

<template>
  <CdxLookup
    v-model:selected="selected"
    v-model:input-value="inputValue"
    class="destination-lookup"
    :menu-items="menuItems"
    :disabled="disabled"
    :menu-config="{ visibleItemLimit: 6, hideDescriptionOverflow: true }"
    placeholder="Destination"
    aria-label="Destination"
    @input="onInput"
    @update:selected="onSelected"
    @blur="commitTyped"
    @keydown.enter="onEnter"
  />
</template>
