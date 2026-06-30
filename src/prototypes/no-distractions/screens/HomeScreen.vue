<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { CdxIcon, CdxMessage, CdxProgressBar } from '@wikimedia/codex'
import { cdxIconArrowNext } from '@wikimedia/codex-icons'

import ChromeWrapper from '@/components/chrome/ChromeWrapper.vue'

import ReturnToArticle from '../components/ReturnToArticle.vue'
import SuggestionCard from '../components/SuggestionCard.vue'
import { useSuggestions } from '../data/useSuggestions'
import type { FlowState } from '../data/useFlowState'

const props = defineProps<{ flow: FlowState }>()

const { suggestions, loading, error, count } = useSuggestions()

const topSuggestions = computed(() => suggestions.value.slice(0, 3))
const returnTitle = computed(() => props.flow.title.value || 'reading')
const viewAllLabel = computed(() =>
  count.value > 0 ? `View all ${count.value} suggestions` : 'View all suggestions',
)

const canOpenAll = computed(() => suggestions.value.length > 0)

function openAllSuggestions(): void {
  if (!canOpenAll.value) return
  void props.flow.goTo('all')
}

function scrollToTop() {
  window.scrollTo({ top: 0, left: 0, behavior: 'instant' })
}

onMounted(scrollToTop)
</script>

<template>
  <ChromeWrapper skin="mobile" :last-edited-notice="false" :show-footer="false">
    <div class="home">
      <ReturnToArticle :title="returnTitle" @click="props.flow.goTo('read')" />

      <section
        class="home__module home__module--suggestions"
        :class="{ 'home__module--interactive': canOpenAll }"
        :role="canOpenAll ? 'button' : undefined"
        :tabindex="canOpenAll ? 0 : undefined"
        :aria-label="canOpenAll ? viewAllLabel : undefined"
        @click="openAllSuggestions"
        @keydown.enter.prevent="openAllSuggestions"
        @keydown.space.prevent="openAllSuggestions"
      >
        <header class="home__module-head">
          <h2 class="home__module-title">Suggested edits</h2>
          <span v-if="canOpenAll" class="home__module-chevron" aria-hidden="true">
            <CdxIcon :icon="cdxIconArrowNext" />
          </span>
        </header>

        <CdxProgressBar v-if="loading && !suggestions.length" inline aria-label="Loading suggestions" />

        <CdxMessage v-else-if="error" type="error" :allow-user-dismiss="false">
          {{ error }}
        </CdxMessage>

        <p v-else-if="!suggestions.length" class="home__empty">
          No suggestions yet — add an interest to get started.
        </p>

        <div v-else class="home__cards">
          <SuggestionCard
            v-for="suggestion in topSuggestions"
            :key="suggestion.title"
            :task-heading="suggestion.taskHeading"
            :task-color="suggestion.taskColor"
            :article-title="suggestion.title"
            :article-description="suggestion.description"
            :task-description="suggestion.taskDescription"
            :thumbnail-src="suggestion.thumbnailSrc"
          />
        </div>

        <div v-if="suggestions.length" class="home__view-all" aria-hidden="true">
          {{ viewAllLabel }}
        </div>
      </section>

      <section class="home__module home__module--impact">
        <div class="home__impact-preview">
          <header class="home__module-head">
            <h2 class="home__module-title">Your impact</h2>
            <span class="home__module-chevron" aria-hidden="true">
              <CdxIcon :icon="cdxIconArrowNext" />
            </span>
          </header>

          <div class="home__impact-hero">
            <img
              class="home__impact-image"
              src="https://en.wikipedia.org/w/extensions/GrowthExperiments/images/intro-heart-article.png?269e6"
              alt=""
            />
            <div class="home__impact-text">
              <p class="home__impact-heading">0 edits to articles so far</p>
              <p class="home__impact-body">
                Help extend free knowledge to the world by editing topics that matter most to you.
              </p>
            </div>
          </div>
        </div>

        <p class="home__impact-footer">
          Start with a few <strong>suggested edits</strong>, then see how many people are viewing
          your contributions here.
        </p>
      </section>
    </div>
  </ChromeWrapper>
</template>

<style scoped>
.home {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-100, 16px);
  padding: var(--spacing-100, 16px);
}

.home__module {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-100, 16px);
  border: var(--border-width-base, 1px) solid var(--border-color-subtle, #c8ccd1);
  border-radius: var(--border-radius-base, 2px);
  padding: var(--spacing-100, 16px);
}

.home__module-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-height: 2rem;
}

.home__module-title {
  margin: 0;
  font-family:
    var(--font-family-system-sans, system-ui, sans-serif), var(--font-family-base, sans-serif);
  font-size: var(--font-size-large, 1.125rem);
  font-weight: var(--font-weight-bold);
  line-height: var(--line-height-large, 1.56);
  color: var(--color-base);
}

.home__module--interactive {
  cursor: pointer;
}

.home__module--interactive:focus-visible {
  outline: 2px solid var(--color-progressive, #36c);
  outline-offset: 2px;
}

.home__module-chevron {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 2rem;
  height: 2rem;
  color: var(--color-base);
}

.home__module-chevron :deep(.cdx-icon) {
  width: 1.25rem;
  height: 1.25rem;
}

.home__cards {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-75, 12px);
}

.home__view-all {
  display: flex;
  align-items: center;
  justify-content: center;
  box-sizing: border-box;
  width: 100%;
  min-height: 2.75rem;
  padding: var(--spacing-75, 12px) var(--spacing-100, 16px);
  border-radius: var(--border-radius-base, 2px);
  background-color: var(--background-color-progressive, #36c);
  font-size: var(--font-size-medium, 1rem);
  font-weight: var(--font-weight-bold);
  line-height: var(--line-height-small, 1.375);
  color: var(--color-inverted, #fff);
  text-align: center;
}

.home__empty {
  margin: 0;
  color: var(--color-subtle);
}

.home__module--impact {
  gap: 0;
  padding: 0;
  overflow: hidden;
}

.home__impact-preview {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-100, 16px);
  padding: var(--spacing-100, 16px);
  background-color: var(--background-color-interactive-subtle, #f8f9fa);
}

.home__impact-hero {
  display: flex;
  align-items: center;
  gap: var(--spacing-100, 16px);
}

.home__impact-image {
  flex-shrink: 0;
  width: 72px;
  height: auto;
}

.home__impact-text {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-25, 4px);
  min-width: 0;
}

.home__impact-heading {
  margin: 0;
  font-size: var(--font-size-medium, 1rem);
  font-weight: var(--font-weight-bold);
  line-height: var(--line-height-small, 1.375);
  color: var(--color-base);
}

.home__impact-body {
  margin: 0;
  font-size: var(--font-size-medium, 1rem);
  line-height: var(--line-height-medium, 1.625);
  color: var(--color-base);
}

.home__impact-footer {
  margin: 0;
  padding: var(--spacing-100, 16px);
  font-size: var(--font-size-small, 0.875rem);
  line-height: var(--line-height-small, 1.375);
  color: var(--color-subtle, #54595d);
}
</style>
