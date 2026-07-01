<script setup lang="ts">
import { computed, inject } from 'vue'

import { globalSkin, PROTOWIKI_CHROME_SKIN } from '@/theme'
import type { Skin } from '@/theme'

/**
 * MediaWiki-style page tab strip (e.g. Article / Talk, or Homepage / User page
 * / Talk). Styling matches the article header's tabs; `skin` drives the
 * desktop (progressive) vs mobile (Minerva, subtle) treatment and defaults to
 * the inherited chrome skin.
 */
export interface PageTab {
  /** Stable id emitted on `select`. */
  id: string
  label: string
  active?: boolean
}

interface Props {
  tabs: PageTab[]
  ariaLabel?: string
  /** Local skin override; defaults to inherited chrome skin / global. */
  skin?: Skin
}

const props = withDefaults(defineProps<Props>(), {
  ariaLabel: 'Page tabs',
  skin: undefined,
})

defineEmits<{ select: [id: string] }>()

const inheritedSkin = inject(PROTOWIKI_CHROME_SKIN)
const effectiveSkin = computed<Skin>(() => props.skin ?? inheritedSkin?.value ?? globalSkin.value)
</script>

<template>
  <nav class="page-tabs" :data-skin="effectiveSkin" :aria-label="ariaLabel">
    <a
      v-for="tab in tabs"
      :key="tab.id"
      href="#"
      class="page-tabs__tab"
      :class="{ 'page-tabs__tab--active': tab.active }"
      :aria-current="tab.active ? 'page' : undefined"
      @click.prevent="$emit('select', tab.id)"
    >
      {{ tab.label }}
    </a>
  </nav>
</template>

<style scoped>
.page-tabs {
  display: flex;
  align-items: center;
  gap: var(--spacing-75, 12px);
  flex-wrap: wrap;
  font-family: var(--font-family-base);
  font-size: var(--font-size-small, 14px);
}

.page-tabs__tab {
  display: inline-flex;
  align-items: center;
  margin: 0 0 -1px;
  padding: var(--spacing-50, 8px) var(--spacing-12, 1px);
  border-bottom: 2px solid transparent;
  color: var(--color-progressive);
  text-decoration: none;
}

.page-tabs__tab:hover {
  text-decoration: underline;
}

.page-tabs__tab--active {
  border-bottom-color: var(--color-base);
  color: var(--color-base);
  font-weight: var(--font-weight-bold);
  text-decoration: none;
}

/* Mobile (Minerva): full-width strip carries the divider; tabs read subtle. */
.page-tabs[data-skin='mobile'] {
  width: 100%;
  align-items: flex-end;
  border-bottom: 1px solid var(--border-color-subtle);
}

.page-tabs[data-skin='mobile'] .page-tabs__tab {
  color: var(--color-subtle);
}

.page-tabs[data-skin='mobile'] .page-tabs__tab:hover {
  color: var(--color-subtle);
  text-decoration: none;
}

.page-tabs[data-skin='mobile'] .page-tabs__tab--active {
  border-bottom-color: var(--color-subtle);
  color: var(--color-subtle);
  font-weight: var(--font-weight-bold);
}
</style>
