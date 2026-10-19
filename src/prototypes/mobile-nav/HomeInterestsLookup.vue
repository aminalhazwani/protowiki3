<script setup lang="ts">
/**
 * The reader's interests as Codex chips, with a title search for adding more
 * (home2). Used by Personalization and by onboarding's interests step. At most
 * `MAX_INTERESTS`: a pick past the limit is dropped again rather than kept unsaved.
 */
import { onBeforeUnmount, ref, watch } from 'vue'
import { CdxMultiselectLookup } from '@wikimedia/codex'
import type { ChipInputItem, MenuItemData, MenuItemValue } from '@wikimedia/codex'

import { fetchTitleSearchResults } from '@/components/search/titleSearch'

import { MAX_INTERESTS } from './data/homeConfig'

/** The interests, in order. Changes from outside (a suggestion added) show up as chips. */
const interests = defineModel<string[]>({ required: true })

const MENU_CONFIG = { showThumbnail: true, boldLabel: true }
const DEBOUNCE_MS = 200

const toChips = (titles: string[]): ChipInputItem[] => titles.map((title) => ({ value: title }))
const same = (a: readonly unknown[], b: readonly unknown[]) =>
  a.length === b.length && a.every((value, i) => String(value) === String(b[i]))

const chips = ref<ChipInputItem[]>(toChips(interests.value))
const selected = ref<MenuItemValue[]>([...interests.value])
const menuItems = ref<MenuItemData[]>([])

watch(interests, (titles) => {
  if (same(selected.value, titles)) return
  selected.value = [...titles]
  chips.value = toChips(titles)
})

watch(selected, (values) => {
  if (values.length > MAX_INTERESTS) {
    selected.value = values.slice(0, MAX_INTERESTS)
    chips.value = chips.value.slice(0, MAX_INTERESTS)
    return
  }
  if (!same(values, interests.value)) interests.value = values.map(String)
})

let controller: AbortController | null = null
let timer: ReturnType<typeof setTimeout> | undefined

async function search(term: string): Promise<void> {
  controller?.abort()
  if (!term.trim()) {
    menuItems.value = []
    return
  }
  controller = new AbortController()
  try {
    const hits = await fetchTitleSearchResults(term, {
      signal: controller.signal,
      clientTag: 'home-interests',
    })
    const picked = new Set(selected.value.map((value) => String(value).toLowerCase()))
    menuItems.value = hits
      .filter((hit) => !picked.has(hit.title.toLowerCase()))
      .map((hit) => ({
        value: hit.title,
        label: hit.title,
        description: hit.description || undefined,
        thumbnail: hit.thumbnailSrc ? { url: hit.thumbnailSrc } : null,
      }))
  } catch (error) {
    if ((error as Error).name !== 'AbortError') menuItems.value = []
  }
}

/** Debounced, and the previous search is aborted. */
function onInput(value: string | number): void {
  clearTimeout(timer)
  timer = setTimeout(() => void search(String(value)), DEBOUNCE_MS)
}

onBeforeUnmount(() => {
  controller?.abort()
  clearTimeout(timer)
})
</script>

<template>
  <CdxMultiselectLookup
    v-model:input-chips="chips"
    v-model:selected="selected"
    :menu-items="menuItems"
    :menu-config="MENU_CONFIG"
    :separate-input="chips.length > 0"
    placeholder="Search articles or topics"
    aria-label="Search articles or topics"
    @input="onInput"
  >
    <template #no-results>No results found.</template>
  </CdxMultiselectLookup>
</template>
