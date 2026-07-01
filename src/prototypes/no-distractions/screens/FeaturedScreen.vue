<script setup lang="ts">
import { computed, nextTick } from 'vue'
import { CdxIcon, CdxMessage, CdxProgressBar } from '@wikimedia/codex'
import { cdxIconHelp, cdxIconHome } from '@wikimedia/codex-icons'

import ChromeWrapper from '@/components/chrome/ChromeWrapper.vue'

import AllSuggestionsStickyHead from '../components/AllSuggestionsStickyHead.vue'
import FeaturedCard from '../components/FeaturedCard.vue'
import { useFeaturedFeed } from '../data/useFeaturedFeed'
import type { FlowState } from '../data/useFlowState'

const props = defineProps<{ flow: FlowState }>()

const { sections, loading, error } = useFeaturedFeed()

const hasContent = computed(() => sections.value.some((section) => section.items.length > 0))

async function goHome() {
  await props.flow.goTo('home')
  await nextTick()
  window.scrollTo({ top: 0, left: 0, behavior: 'instant' })
}

function goToInterests() {
  void props.flow.goTo('interests', { returnTo: 'featured' })
}

function openArticle(title: string) {
  void props.flow.goTo('read', { title })
}
</script>

<template>
  <ChromeWrapper skin="mobile" :last-edited-notice="false" :show-footer="false" brand-to="/no-distractions">
    <div class="featured">
      <AllSuggestionsStickyHead :flow="props.flow" @configure="goToInterests" />

      <div class="featured__content">
        <CdxProgressBar
          v-if="loading && !hasContent"
          inline
          aria-label="Loading featured content"
        />

        <CdxMessage v-else-if="error" type="error" :allow-user-dismiss="false">
          {{ error }}
        </CdxMessage>

        <p v-else-if="!hasContent" class="featured__empty">
          No featured content available for today.
        </p>

        <template v-else>
          <section
            v-for="section in sections"
            :key="section.id"
            class="featured__section"
          >
            <h2 v-if="section.label" class="featured__section-title">{{ section.label }}</h2>
            <div class="featured__cards">
              <FeaturedCard
                v-for="(item, index) in section.items"
                :key="`${section.id}-${index}`"
                :title="item.title"
                :body="item.body"
                :description="item.description"
                :thumbnail-src="item.thumbnailSrc"
                :article-title="item.articleTitle"
                @open="openArticle"
              />
            </div>
          </section>
        </template>
      </div>

      <div class="featured__fab">
        <button class="featured__fab-btn" type="button" aria-label="Home" @click="goHome">
          <CdxIcon :icon="cdxIconHome" />
        </button>
        <button class="featured__fab-btn" type="button" aria-label="Help">
          <CdxIcon :icon="cdxIconHelp" />
        </button>
      </div>
    </div>
  </ChromeWrapper>
</template>

<style scoped>
.featured {
  display: flex;
  flex-direction: column;
  padding-bottom: calc(var(--spacing-100, 16px) + 3.75rem);
}

.featured__content {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-150, 24px);
  padding: 0 var(--spacing-100, 16px) var(--spacing-100, 16px);
}

.featured__section {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-75, 12px);
}

.featured__section-title {
  margin: 0;
  font-family:
    var(--font-family-system-sans, system-ui, sans-serif), var(--font-family-base, sans-serif);
  font-size: var(--font-size-large, 1.125rem);
  font-weight: var(--font-weight-bold);
  line-height: var(--line-height-large, 1.56);
  color: var(--color-base);
}

.featured__cards {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-75, 12px);
}

.featured__empty {
  margin: 0;
  color: var(--color-subtle);
}

.featured__fab {
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
  .featured__fab {
    right: calc((100vw - min(100vw, 412px)) / 2 + var(--spacing-50, 8px));
  }
}

.featured__fab-btn {
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

.featured__fab-btn :deep(.cdx-icon) {
  width: 1.25rem;
  height: 1.25rem;
}
</style>
