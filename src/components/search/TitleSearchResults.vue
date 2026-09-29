<script setup lang="ts">
import { CdxIcon } from '@wikimedia/codex'
import { cdxIconArticleSearch } from '@wikimedia/codex-icons'

import type { TitleSearchResult } from './titleSearch'

interface Props {
  results: TitleSearchResult[]
  /** Flush beneath an input (**`attached`**) or a standalone list (**`detached`**). */
  layout?: 'attached' | 'detached'
  /**
   * Real destination for each row. Given one, rows render as links — which is
   * what a middle- or ⌘-click opens in a new tab, and what the browser shows in
   * the status bar. Without one they render as buttons and **`select`** is the
   * only way in.
   */
  resolveHref?: (title: string) => string
}

withDefaults(defineProps<Props>(), {
  layout: 'detached',
  resolveHref: undefined,
})

defineEmits<{
  /**
   * A row was clicked. Carries the page title and the original event, so a
   * listener can decide between handling it in place (**`preventDefault()`**)
   * and letting the row's own **`href`** navigate.
   */
  select: [title: string, event: MouseEvent]
}>()
</script>

<template>
  <ul
    class="title-search-results"
    :class="{ 'title-search-results--attached': layout === 'attached' }"
  >
    <li v-for="result in results" :key="result.title">
      <component
        :is="resolveHref ? 'a' : 'button'"
        :href="resolveHref ? resolveHref(result.title) : undefined"
        :type="resolveHref ? undefined : 'button'"
        class="title-search-results__item"
        @click="$emit('select', result.title, $event)"
      >
        <span class="title-search-results__thumb">
          <img v-if="result.thumbnailSrc" :src="result.thumbnailSrc" alt="" />
          <CdxIcon v-else :icon="cdxIconArticleSearch" size="small" />
        </span>
        <span class="title-search-results__text">
          <span class="title-search-results__title">{{ result.title }}</span>
          <span v-if="result.description" class="title-search-results__desc">{{
            result.description
          }}</span>
        </span>
      </component>
    </li>
  </ul>
</template>

<style scoped>
.title-search-results {
  display: flex;
  flex-direction: column;
  margin: var(--spacing-25, 4px) 0 0;
  padding: 0;
  list-style: none;
  border: var(--border-width-base, 1px) solid var(--border-color-subtle, #c8ccd1);
  border-radius: var(--border-radius-base, 2px);
  overflow: hidden;
}

.title-search-results--attached {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  z-index: var(--z-index-dropdown, 50);
  margin: 0;
  border-top: none;
  border-radius: 0 0 var(--border-radius-base, 2px) var(--border-radius-base, 2px);
  background-color: var(--background-color-base, #fff);
  box-shadow: var(--box-shadow-outset-large-below, 0 4px 8px 0)
    var(--box-shadow-color-alpha-base, rgba(0, 0, 0, 0.06));
}

.title-search-results__item {
  display: flex;
  align-items: center;
  gap: var(--spacing-75, 12px);
  width: 100%;
  margin: 0;
  padding: var(--spacing-50, 8px) var(--spacing-100, 16px);
  border: none;
  background: transparent;
  font: inherit;
  line-height: var(--line-height-small, 1.375);
  text-align: start;
  cursor: pointer;
}

/* The row is an `<a>` when it has an href — undo the wiki link treatment. */
.title-search-results__item,
.title-search-results__item:visited,
.title-search-results__item:hover {
  color: var(--color-base, #202122);
  text-decoration: none;
}

.title-search-results__item:hover {
  background-color: var(--background-color-interactive-subtle, #f8f9fa);
}

.title-search-results li + li {
  border-top: var(--border-width-base, 1px) solid var(--border-color-subtle, #c8ccd1);
}

.title-search-results__thumb {
  display: inline-flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  width: 2.5rem;
  height: 2.5rem;
  border: var(--border-width-base, 1px) solid var(--border-color-subtle, #c8ccd1);
  border-radius: var(--border-radius-base, 2px);
  background-color: var(--background-color-interactive-subtle, #f8f9fa);
  overflow: hidden;
  color: var(--color-subtle, #54595d);
}

.title-search-results__thumb img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.title-search-results__text {
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.title-search-results__title {
  display: block;
  font-size: var(--font-size-medium, 1rem);
  font-weight: var(--font-weight-bold, 700);
  line-height: var(--line-height-small, 1.375);
  color: var(--color-base, #202122);
}

.title-search-results__desc {
  display: block;
  overflow: hidden;
  font-size: var(--font-size-small, 0.875rem);
  line-height: var(--line-height-small, 1.375);
  color: var(--color-subtle, #54595d);
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
