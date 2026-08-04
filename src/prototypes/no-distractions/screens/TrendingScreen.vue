<script setup lang="ts">
import { computed, nextTick } from 'vue'
import { CdxIcon, CdxMessage, CdxProgressBar } from '@wikimedia/codex'
import { cdxIconHelp, cdxIconHome } from '@wikimedia/codex-icons'

import ChromeWrapper from '@/components/chrome/ChromeWrapper.vue'

import AllSuggestionsStickyHead from '../components/AllSuggestionsStickyHead.vue'
import FeaturedCard from '../components/FeaturedCard.vue'
import { useTrendingPages } from '../data/useTrendingPages'
import { useBrandTo } from '../data/useBrandTo'
import type { FlowState } from '../data/useFlowState'

const props = defineProps<{ flow: FlowState }>()

const brandTo = useBrandTo()

const { pages, loading, error } = useTrendingPages()

const hasContent = computed(() => pages.value.length > 0)

async function goHome() {
  await props.flow.goTo('home')
  await nextTick()
  window.scrollTo({ top: 0, left: 0, behavior: 'instant' })
}

function goToInterests() {
  void props.flow.goTo('interests', { returnTo: 'trending' })
}

function openArticle(title: string) {
  void props.flow.goTo('read', { title })
}
</script>

<template>
  <ChromeWrapper skin="mobile" :last-edited-notice="false" :show-footer="false" :brand-to="brandTo">
    <div class="trending">
      <AllSuggestionsStickyHead :flow="props.flow" @configure="goToInterests" />

      <div class="trending__content">
        <CdxProgressBar v-if="loading && !hasContent" inline aria-label="Loading trending pages" />

        <CdxMessage v-else-if="error" type="error" :allow-user-dismiss="false">
          {{ error }}
        </CdxMessage>

        <p v-else-if="!hasContent" class="trending__empty">
          No trending pages available right now.
        </p>

        <div v-else class="trending__list">
          <FeaturedCard
            v-for="page in pages"
            :key="page.articleTitle"
            :title="page.title"
            :body="page.viewsLabel"
            :thumbnail-src="page.thumbnailSrc"
            :article-title="page.articleTitle"
            @open="openArticle"
          />
        </div>
      </div>

      <div class="trending__fab">
        <button class="trending__fab-btn" type="button" aria-label="Home" @click="goHome">
          <CdxIcon :icon="cdxIconHome" />
        </button>
        <button class="trending__fab-btn" type="button" aria-label="Help">
          <CdxIcon :icon="cdxIconHelp" />
        </button>
      </div>
    </div>
  </ChromeWrapper>
</template>

<style scoped>
.trending {
  display: flex;
  flex-direction: column;
  padding-bottom: calc(var(--spacing-100, 16px) + 3.75rem);
}

.trending__content {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-100, 16px);
  padding: 0 var(--spacing-100, 16px) var(--spacing-100, 16px);
}

.trending__list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-75, 12px);
}

.trending__empty {
  margin: 0;
  color: var(--color-subtle);
}

.trending__fab {
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
  .trending__fab {
    right: calc((100vw - min(100vw, 412px)) / 2 + var(--spacing-50, 8px));
  }
}

.trending__fab-btn {
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

.trending__fab-btn :deep(.cdx-icon) {
  width: 1.25rem;
  height: 1.25rem;
}
</style>
