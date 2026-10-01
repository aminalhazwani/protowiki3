<script setup lang="ts">
/**
 * "Personalization" (home2): which of the reader's activity shapes the
 * personal modules, with a lookup for adding interests. Opened over the Home
 * from a personal module's "Configure"; the modules reload as things change.
 */
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { CdxMultiselectLookup, CdxToggleSwitch } from '@wikimedia/codex'
import type { ChipInputItem, MenuItemData, MenuItemValue } from '@wikimedia/codex'

import { fetchTitleSearchResults } from '@/components/search/titleSearch'
import { useConfig } from '@/composables/useConfig'

import { MAX_INTERESTS, type HomeSources } from './data/homeConfig'
import HomeDialogShell from './HomeDialogShell.vue'
import { useHomePersonalization } from './useHomePersonalization'

const open = defineModel<boolean>('open', { required: true })

const { interests, sources, setInterests, setSource } = useHomePersonalization()
const { currentUserPageLists } = useConfig()

const count = (n: number, one: string, many: string) => (n === 1 ? `1 ${one}` : `${n} ${many}`)

/** home2's rows: each source with how much of the reader's activity it holds. */
const rows = computed(
  (): { key: keyof HomeSources; label: string; count: number; unit: string }[] => {
    const lists = currentUserPageLists.value
    return [
      {
        key: 'interests',
        label: 'Interests or topics',
        count: interests.value.length,
        unit: 'page',
      },
      { key: 'saved', label: 'Saved pages', count: lists.readingList.length, unit: 'page' },
      { key: 'watchlist', label: 'Watchlist', count: lists.watchlist.length, unit: 'page' },
      {
        key: 'contributions',
        label: 'Contributions',
        count: lists.editedPages.length,
        unit: 'edit',
      },
    ]
  },
)

// The lookup holds its own chips; the dialog's content mounts on each open, so
// starting from the saved interests is enough.
const chips = ref<ChipInputItem[]>(interests.value.map((title) => ({ value: title })))
const selected = ref<MenuItemValue[]>([...interests.value])
const menuItems = ref<MenuItemData[]>([])
const MENU_CONFIG = { showThumbnail: true, boldLabel: true }

watch(selected, (values) => {
  // Past the limit, the newest pick is dropped again rather than kept unsaved.
  if (values.length > MAX_INTERESTS) {
    selected.value = values.slice(0, MAX_INTERESTS)
    chips.value = chips.value.slice(0, MAX_INTERESTS)
    return
  }
  setInterests(values.map(String))
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

/** Debounced 200ms, and the previous search is aborted. */
function onInput(value: string | number): void {
  clearTimeout(timer)
  timer = setTimeout(() => void search(String(value)), 200)
}

onBeforeUnmount(() => {
  controller?.abort()
  clearTimeout(timer)
})
</script>

<template>
  <HomeDialogShell
    v-model:open="open"
    title="Personalization"
    subtitle="Choose which activity shapes the recommendations on your Home."
  >
    <div class="home-personalization-dialog">
      <template v-for="row in rows" :key="row.key">
        <CdxToggleSwitch
          :model-value="sources[row.key]"
          align-switch
          @update:model-value="setSource(row.key, $event)"
        >
          {{ row.label }}
          <template #description>
            <span
              class="home-personalization-dialog__count"
              :class="{ 'home-personalization-dialog__count--active': row.count > 0 }"
            >
              {{ count(row.count, row.unit, `${row.unit}s`) }}
            </span>
          </template>
        </CdxToggleSwitch>

        <CdxMultiselectLookup
          v-if="row.key === 'interests' && sources.interests"
          v-model:input-chips="chips"
          v-model:selected="selected"
          class="home-personalization-dialog__lookup"
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
    </div>
  </HomeDialogShell>
</template>

<style scoped>
.home-personalization-dialog {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-75);
}

/* Sits close under its switch, which it belongs to. */
.home-personalization-dialog__lookup {
  margin-top: calc(-1 * var(--spacing-25));
}

.home-personalization-dialog__count {
  color: var(--color-subtle);
}

/* A source with something in it reads as live. */
.home-personalization-dialog__count--active {
  color: var(--color-progressive);
}
</style>
