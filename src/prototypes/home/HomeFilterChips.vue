<script setup lang="ts">
/**
 * A module's filter strip: "All", then one toggle per filter; exactly one is
 * on. A single row that scrolls sideways when it doesn't fit — on Minerva, out
 * to the screen edges.
 */
import { nextTick, ref, watch } from 'vue'
import { CdxToggleButton } from '@wikimedia/codex'

import type { HomeModuleFilter } from './modules'

const props = defineProps<{
  filters: readonly HomeModuleFilter[]
  label: string
}>()

/** The selected filter's id; `null` is "All". */
const selected = defineModel<string | null>({ required: true })

const track = ref<HTMLElement | null>(null)

function select(id: string | null, on: boolean): void {
  // Turning the selected one off keeps it on: one filter is always chosen.
  if (on) selected.value = id
}

// Keep the chosen toggle in view when it was only partly visible.
watch(selected, async () => {
  await nextTick()
  track.value
    ?.querySelector('[aria-pressed="true"]')
    ?.scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: 'smooth' })
})

const options = () => [{ id: null, label: 'All' }, ...props.filters]
</script>

<template>
  <div ref="track" class="home-filter-chips" role="group" :aria-label="label">
    <CdxToggleButton
      v-for="option in options()"
      :key="option.id ?? 'all'"
      :model-value="selected === option.id"
      @update:model-value="select(option.id, $event)"
    >
      {{ option.label }}
    </CdxToggleButton>
  </div>
</template>

<style scoped>
/*
 * CODEX+ No filter-chip component: separate CdxToggleButtons in a scrolling
 * row (`CdxToggleButtonGroup` joins its buttons and wraps instead).
 * The row bleeds through the page gutter (`--home-gutter`, set by the Home) so
 * toggles scroll to the screen edge, while the first one still lines up.
 */
.home-filter-chips {
  display: flex;
  gap: var(--spacing-50);
  margin-inline: calc(-1 * var(--home-gutter, 0px));
  padding-inline: var(--home-gutter, 0px);
  scroll-padding-inline: var(--home-gutter, 0px);
  overflow-x: auto;
  overscroll-behavior-x: contain;
  scrollbar-width: none;
}

.home-filter-chips::-webkit-scrollbar {
  display: none;
}

.home-filter-chips > * {
  flex: 0 0 auto;
}
</style>
