<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue'
import { CdxButton, CdxIcon, CdxPopover, CdxTextInput } from '@wikimedia/codex'
import { cdxIconSearch } from '@wikimedia/codex-icons'

import { ICON_CATALOG } from './codexIconCatalog'
import type { CodexIconName } from './codexIconCatalog'

interface Props {
  open: boolean
  anchor: HTMLElement | null
  selected: CodexIconName | null
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'update:open': [open: boolean]
  select: [name: CodexIconName]
}>()

const filter = ref('')
const gridEl = ref<HTMLElement | null>(null)

const filtered = computed(() => {
  const q = filter.value.trim().toLowerCase()
  if (!q) return ICON_CATALOG
  return ICON_CATALOG.filter(
    (entry) => entry.label.toLowerCase().includes(q) || entry.name.toLowerCase().includes(q),
  )
})

watch(
  () => props.open,
  (open) => {
    if (!open) return
    filter.value = ''
    void nextTick(() => {
      gridEl.value
        ?.querySelector<HTMLElement>('[aria-pressed="true"]')
        ?.scrollIntoView({ block: 'center' })
    })
  },
)

function pick(name: CodexIconName): void {
  emit('select', name)
  emit('update:open', false)
}
</script>

<template>
  <CdxPopover
    :open="open"
    :anchor="anchor"
    placement="bottom-start"
    title="Choose an icon"
    use-close-button
    close-button-label="Close"
    :use-bottom-sheet="true"
    class="icon-picker-popover"
    @update:open="emit('update:open', $event)"
  >
    <!-- Stop Escape here so it closes only the picker, not the dialog behind it. -->
    <div class="icon-picker" @keyup.stop>
      <CdxTextInput
        v-model="filter"
        class="icon-picker__filter"
        :start-icon="cdxIconSearch"
        clearable
        placeholder="Filter icons"
        aria-label="Filter icons"
      />
      <div ref="gridEl" class="icon-picker__grid" role="group" aria-label="Icons">
        <CdxButton
          v-for="entry in filtered"
          :key="entry.name"
          weight="quiet"
          class="icon-picker__cell"
          :class="{ 'icon-picker__cell--selected': entry.name === selected }"
          :aria-label="entry.label"
          :aria-pressed="entry.name === selected"
          :title="entry.label"
          @click="pick(entry.name)"
        >
          <CdxIcon :icon="entry.icon" />
        </CdxButton>
      </div>
      <p v-if="filtered.length === 0" class="icon-picker__empty">No icons match.</p>
    </div>
  </CdxPopover>
</template>

<style scoped>
.icon-picker-popover.cdx-popover {
  width: min(352px, calc(100vw - 32px));
}

.icon-picker__filter {
  position: sticky;
  top: 0;
  z-index: 1;
  background-color: var(--background-color-base, #fff);
  padding-bottom: var(--spacing-50, 8px);
}

.icon-picker__grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(44px, 1fr));
  gap: 2px;
}

.icon-picker__cell.cdx-button {
  min-width: 44px;
  width: 44px;
  height: 44px;
  padding: 0;
}

.icon-picker__cell--selected.cdx-button {
  background-color: var(--background-color-progressive-subtle, #eaf3ff);
  color: var(--color-progressive, #36c);
}

.icon-picker__empty {
  margin: var(--spacing-100, 16px) 0 0;
  color: var(--color-subtle, #54595d);
  font-size: var(--font-size-small, 0.875rem);
}
</style>
