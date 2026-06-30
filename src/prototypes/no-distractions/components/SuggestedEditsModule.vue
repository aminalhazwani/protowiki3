<script setup lang="ts">
import { computed } from 'vue'
import { CdxIcon, CdxMessage, CdxProgressBar } from '@wikimedia/codex'
import { cdxIconArrowNext, cdxIconArticle, cdxIconChart } from '@wikimedia/codex-icons'

import type { Suggestion } from '../data/useSuggestions'

/**
 * GrowthExperiments-style "Suggested edits" card: a tinted summary with a single
 * suggestion preview, a "1 of N" counter, and a "See all suggestions" button.
 * Driven by the shared useSuggestions() state; the preview is the top pick and
 * the count is the (limited) fetched list size, not a server-wide total.
 */
const props = defineProps<{
  suggestions: Suggestion[]
  loading: boolean
  error: string | null
  count: number
}>()

const emit = defineEmits<{ openAll: [] }>()

const featured = computed<Suggestion | null>(() => props.suggestions[0] ?? null)
</script>

<template>
  <section class="se-module">
    <header class="se-module__head">
      <h2 class="se-module__title">Suggested edits</h2>
      <span v-if="featured" class="se-module__chevron" aria-hidden="true">
        <CdxIcon :icon="cdxIconArrowNext" />
      </span>
    </header>

    <CdxProgressBar v-if="loading && !suggestions.length" inline aria-label="Loading suggestions" />

    <CdxMessage v-else-if="error" type="error" :allow-user-dismiss="false">
      {{ error }}
    </CdxMessage>

    <p v-else-if="!featured" class="se-module__empty">
      No suggestions yet — add an interest to get started.
    </p>

    <template v-else>
      <p class="se-module__counter">1 of {{ count }} suggestions</p>

      <div class="se-module__preview">
        <span class="se-module__thumb">
          <img
            v-if="featured.thumbnailSrc"
            :src="featured.thumbnailSrc"
            alt=""
            width="48"
            height="48"
          />
          <CdxIcon v-else :icon="cdxIconArticle" />
        </span>
        <div class="se-module__preview-text">
          <p class="se-module__article-title">{{ featured.title }}</p>
          <p class="se-module__article-description">{{ featured.description }}</p>
          <span
            class="se-module__task-type"
            :class="`se-module__task-type--${featured.taskColor}`"
          >
            <CdxIcon :icon="cdxIconChart" size="small" class="se-module__task-type-icon" />
            {{ featured.taskHeading }}
          </span>
        </div>
      </div>

      <button type="button" class="se-module__button" @click="emit('openAll')">
        See all suggestions
      </button>
    </template>
  </section>
</template>

<style scoped>
.se-module {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-75, 12px);
  border: var(--border-width-base, 1px) solid var(--border-color-subtle, #c8ccd1);
  border-radius: var(--border-radius-base, 2px);
  padding: var(--spacing-100, 16px);
  background-color: var(--background-color-progressive-subtle, #e8eeff);
}

.se-module__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-height: 2rem;
}

.se-module__title {
  margin: 0;
  font-family:
    var(--font-family-system-sans, system-ui, sans-serif), var(--font-family-base, sans-serif);
  font-size: var(--font-size-large, 1.125rem);
  font-weight: var(--font-weight-bold);
  line-height: var(--line-height-large, 1.56);
  color: var(--color-base);
}

.se-module__chevron {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 2rem;
  height: 2rem;
  color: var(--color-base);
}

.se-module__chevron :deep(.cdx-icon) {
  width: 1.25rem;
  height: 1.25rem;
}

.se-module__counter {
  margin: 0;
  font-size: var(--font-size-small, 0.875rem);
  line-height: var(--line-height-small, 1.375);
  color: var(--color-subtle, #54595d);
}

.se-module__preview {
  display: flex;
  align-items: flex-start;
  gap: var(--spacing-75, 12px);
  padding: var(--spacing-75, 12px);
  border: var(--border-width-base, 1px) solid var(--border-color-subtle, #c8ccd1);
  border-radius: var(--border-radius-base, 2px);
  background-color: var(--background-color-base, #fff);
}

.se-module__thumb {
  display: inline-flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  width: 48px;
  height: 48px;
  overflow: hidden;
  border-radius: var(--border-radius-base, 2px);
  background-color: var(--background-color-interactive-subtle, #f8f9fa);
  color: var(--color-placeholder, #72777d);
}

.se-module__thumb img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: top;
}

.se-module__preview-text {
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: var(--spacing-25, 4px);
  min-width: 0;
}

.se-module__article-title {
  margin: 0;
  font-size: var(--font-size-medium, 1rem);
  font-weight: var(--font-weight-bold);
  line-height: var(--line-height-medium, 1.625);
  color: var(--color-base);
}

.se-module__article-description {
  display: -webkit-box;
  margin: 0;
  overflow: hidden;
  font-size: var(--font-size-small, 0.875rem);
  line-height: var(--line-height-small, 1.375);
  color: var(--color-subtle, #54595d);
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
}

.se-module__task-type {
  display: inline-flex;
  align-self: flex-end;
  align-items: center;
  gap: var(--spacing-25, 4px);
  margin-top: var(--spacing-25, 4px);
  font-size: var(--font-size-small, 0.875rem);
  font-weight: var(--font-weight-bold);
}

.se-module__task-type--green {
  color: var(--color-success, #177860);
}

.se-module__task-type--amber {
  color: var(--color-warning, #886425);
}

.se-module__task-type-icon {
  flex-shrink: 0;
  color: inherit;
}

.se-module__button {
  box-sizing: border-box;
  width: 100%;
  min-height: 2.75rem;
  padding: var(--spacing-75, 12px) var(--spacing-100, 16px);
  border: none;
  border-radius: var(--border-radius-base, 2px);
  background-color: var(--background-color-progressive, #36c);
  font-size: var(--font-size-medium, 1rem);
  font-weight: var(--font-weight-bold);
  line-height: var(--line-height-small, 1.375);
  color: var(--color-inverted, #fff);
  text-align: center;
  cursor: pointer;
}

.se-module__button:hover {
  background-color: var(--background-color-progressive--hover, #447ff5);
}

.se-module__button:focus-visible {
  outline: 2px solid var(--color-progressive, #36c);
  outline-offset: 2px;
}
</style>
