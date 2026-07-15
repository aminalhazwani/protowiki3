<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRoute } from 'vue-router'

import MobileSubpageHeader from '@/prototypes/template-homepage/MobileSubpageHeader.vue'
import TaskFullscreenShell from '@/prototypes/template-homepage/TaskFullscreenShell.vue'
import SuggestedEditsView from '@/prototypes/template-homepage/SuggestedEditsView.vue'
import { useConfig } from '@/composables/useConfig'
import { wikiEditUrlFromLang } from '@/config'

import { fetchPageviewsLast60Days } from '../data/fetchPageviews'
import { useSuggestions, type Suggestion } from '../data/useSuggestions'
import type { FlowState } from '../data/useFlowState'

/**
 * GrowthExperiments-style "Suggested edits" carousel for the interest-based
 * suggestions. Reuses the shared SuggestedEditsView (prop-driven) and walks the
 * shared useSuggestions() list with a local index. Page-view counts are fetched
 * live; time estimates are hardcoded per task type.
 */
const props = defineProps<{ flow: FlowState }>()

const route = useRoute()
const { lang } = useConfig()
const { suggestions, loading, error } = useSuggestions()

const currentIndex = ref(0)

const total = computed(() => suggestions.value.length)
const current = computed<Suggestion | null>(() => suggestions.value[currentIndex.value] ?? null)

// Keep the index in range as the (async) list settles or shrinks.
watch(total, (count) => {
  if (currentIndex.value > count - 1) currentIndex.value = Math.max(0, count - 1)
})

const DIFFICULTY_BY_COLOR = { green: 'easy', amber: 'medium' } as const

/** Hardcoded effort per task type (the four named values + similar-tier guesses). */
const TIME_ESTIMATE_BY_HEADING: Record<string, string> = {
  'Add links between articles': '3–5 minutes',
  'Add an image': '3–5 minutes',
  'Add an image to an article section': '3–5 minutes',
  'Revise tone': '5–10 minutes',
  Copyedit: '5–10 minutes',
  'Find references': '15–20 minutes',
  'Expand short articles': '20–30 minutes',
  'Update articles': '20–30 minutes',
}
const DEFAULT_TIME_ESTIMATE = '5–10 minutes'

// Live pageviews (last 60 days), fetched once per article title and cached.
const pageviewsByTitle = ref<Map<string, number>>(new Map())

watch(
  current,
  (suggestion) => {
    if (!suggestion) return
    const { title } = suggestion
    if (pageviewsByTitle.value.has(title)) return
    void fetchPageviewsLast60Days(title, { lang: lang.value }).then((views) => {
      if (views != null) pageviewsByTitle.value.set(title, views)
    })
  },
  { immediate: true },
)

const backTo = computed(() => ({ query: { ...route.query, screen: 'home' } }))

const viewProps = computed(() => {
  const suggestion = current.value
  const views = suggestion ? pageviewsByTitle.value.get(suggestion.title) : undefined

  return {
    showFilterBar: true,
    topicFilter: 'Interests',
    difficultyFilter: 'Easy, Medium',
    currentIndex: currentIndex.value,
    totalCount: total.value || 1,
    articleTitle: suggestion?.title,
    articleShortDescription: suggestion?.description,
    thumbnailSrc: suggestion?.thumbnailSrc,
    pageviewsLabel:
      views != null ? `${views.toLocaleString()} visits (past 60 days)` : undefined,
    taskHeading: suggestion?.taskHeading,
    taskDescription: suggestion?.taskDescription,
    taskDifficulty: suggestion ? DIFFICULTY_BY_COLOR[suggestion.taskColor] : undefined,
    taskTimeEstimate: suggestion
      ? TIME_ESTIMATE_BY_HEADING[suggestion.taskHeading] ?? DEFAULT_TIME_ESTIMATE
      : undefined,
    editHref: suggestion?.title ? wikiEditUrlFromLang(lang.value, suggestion.title) : undefined,
    refreshing: loading.value && !total.value,
    refreshError: error.value,
    emptyMessage:
      !loading.value && !total.value
        ? 'No suggestions yet — add an interest to get started.'
        : undefined,
    canGoPrev: currentIndex.value > 0,
    canGoNext: currentIndex.value < total.value - 1,
  }
})

function onNavigate(delta: number): void {
  const next = currentIndex.value + delta
  if (next < 0 || next >= total.value) return
  currentIndex.value = next
}

function onOpenInterests(): void {
  void props.flow.goTo('interests', { returnTo: 'all' })
}
</script>

<template>
  <TaskFullscreenShell skin="mobile">
    <div class="se-carousel">
      <div class="se-carousel__header">
        <MobileSubpageHeader
          title="Suggested edits"
          :back-to="backTo"
          back-label="Back to home"
          :bleed="false"
        />
      </div>

      <div class="se-carousel__body">
        <SuggestedEditsView
          v-bind="viewProps"
          @navigate="onNavigate"
          @open-interests="onOpenInterests"
        />
      </div>
    </div>
  </TaskFullscreenShell>
</template>

<style scoped>
.se-carousel {
  position: relative;
  display: flex;
  flex: 1;
  flex-direction: column;
  width: 100%;
  min-height: 0;
  overflow: hidden;
}

.se-carousel__header {
  flex-shrink: 0;
  box-sizing: border-box;
  width: 100%;
  padding: env(safe-area-inset-top, 0px) 4px 0;
  background-color: var(--background-color-base, #fff);
  border-bottom: 1px solid var(--border-color-base, #a2a9b1);
}

.se-carousel__header :deep(.mobile-subpage-header) {
  margin: 0;
  padding: 0;
  border-bottom: none;
}

.se-carousel__body {
  display: flex;
  flex: 1;
  flex-direction: column;
  min-height: 0;
  overflow: hidden;
  background-color: var(--background-color-neutral-subtle, #f8f9fa);
}
</style>
