<script setup lang="ts">
import { computed, nextTick } from 'vue'
import { CdxIcon, CdxMessage, CdxProgressBar } from '@wikimedia/codex'
import { cdxIconHelp, cdxIconHome } from '@wikimedia/codex-icons'

import ChromeWrapper from '@/components/chrome/ChromeWrapper.vue'

import AllSuggestionsStickyHead from '../components/AllSuggestionsStickyHead.vue'
import RecentChangeCard from '../components/RecentChangeCard.vue'
import SuggestionCard from '../components/SuggestionCard.vue'
import { useRecentChanges } from '../data/useRecentChanges'
import { useSuggestionFilters } from '../data/useSuggestionFilters'
import { useSuggestions } from '../data/useSuggestions'
import type { FlowState } from '../data/useFlowState'

const props = defineProps<{ flow: FlowState }>()

const isRecentChanges = computed(() => props.flow.module.value === 'recent-changes')

const { suggestions, loading: suggestionsLoading, error: suggestionsError } = useSuggestions()
const { changes, loading: changesLoading, error: changesError } = useRecentChanges()
const { isEnabled } = useSuggestionFilters()

const visibleSuggestions = computed(() =>
  suggestions.value.filter((suggestion) => isEnabled(suggestion.taskHeading)),
)

const loading = computed(() =>
  isRecentChanges.value ? changesLoading.value : suggestionsLoading.value,
)
const error = computed(() => (isRecentChanges.value ? changesError.value : suggestionsError.value))
const hasItems = computed(() =>
  isRecentChanges.value ? changes.value.length > 0 : visibleSuggestions.value.length > 0,
)

async function goHome() {
  await props.flow.goTo('home')
  await nextTick()
  window.scrollTo({ top: 0, left: 0, behavior: 'instant' })
}

function goToInterests() {
  void props.flow.goTo('interests', { returnTo: 'all' })
}
</script>

<template>
  <ChromeWrapper skin="mobile" :last-edited-notice="false" :show-footer="false" brand-to="/no-distractions">
    <div class="all">
      <AllSuggestionsStickyHead :flow="props.flow" @configure="goToInterests" />

      <div class="all__content">
        <CdxProgressBar
          v-if="loading && !hasItems"
          inline
          :aria-label="isRecentChanges ? 'Loading recent changes' : 'Loading suggestions'"
        />

        <CdxMessage v-else-if="error" type="error" :allow-user-dismiss="false">
          {{ error }}
        </CdxMessage>

        <p v-else-if="!hasItems" class="all__empty">
          <template v-if="isRecentChanges">
            No recent changes yet — add an interest to get started.
          </template>
          <template v-else-if="suggestions.length > 0">
            No suggestions match the current filters.
          </template>
          <template v-else> No suggestions yet — add an interest to get started. </template>
        </p>

        <div v-else-if="isRecentChanges" class="all__list">
          <RecentChangeCard
            v-for="change in changes"
            :key="change.title"
            :article-title="change.title"
            :article-description="change.description"
            :editor="change.editor"
            :relative-time="change.relativeTime"
            :edit-summary="change.editSummary"
            :thumbnail-src="change.thumbnailSrc"
          />
        </div>

        <div v-else class="all__list">
          <SuggestionCard
            v-for="suggestion in visibleSuggestions"
            :key="suggestion.title"
            :task-heading="suggestion.taskHeading"
            :task-color="suggestion.taskColor"
            :article-title="suggestion.title"
            :article-description="suggestion.description"
            :task-description="suggestion.taskDescription"
            :thumbnail-src="suggestion.thumbnailSrc"
          />
        </div>
      </div>

      <div class="all__fab">
        <button class="all__fab-btn" type="button" aria-label="Home" @click="goHome">
          <CdxIcon :icon="cdxIconHome" />
        </button>
        <button class="all__fab-btn" type="button" aria-label="Help">
          <CdxIcon :icon="cdxIconHelp" />
        </button>
      </div>
    </div>
  </ChromeWrapper>
</template>

<style scoped>
.all {
  display: flex;
  flex-direction: column;
  padding-bottom: calc(var(--spacing-100, 16px) + 3.75rem);
}

.all__content {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-100, 16px);
  padding: 0 var(--spacing-100, 16px) var(--spacing-100, 16px);
}

.all__list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-75, 12px);
}

.all__empty {
  margin: 0;
  color: var(--color-subtle);
}

.all__fab {
  position: fixed;
  right: var(--spacing-50, 8px);
  bottom: 12px;
  z-index: 10;
  display: inline-flex;
  gap: 0;
  padding: var(--spacing-25, 4px);
  border-radius: var(--border-radius-pill, 9999px);
  background-color: var(--background-color-interactive, #eaecf0);
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.2);
}

@media (min-width: 480px) {
  .all__fab {
    right: calc((100vw - min(100vw, 412px)) / 2 + var(--spacing-50, 8px));
  }
}

.all__fab-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 2.75rem;
  height: 2.75rem;
  padding: 0;
  border: none;
  border-radius: var(--border-radius-circle, 50%);
  background: transparent;
  color: var(--color-base);
  cursor: pointer;
}

.all__fab-btn :deep(.cdx-icon) {
  width: 1.25rem;
  height: 1.25rem;
}
</style>
