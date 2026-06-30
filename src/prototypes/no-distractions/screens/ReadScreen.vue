<script setup lang="ts">
import { computed, ref } from 'vue'
import { CdxMessage, CdxProgressBar } from '@wikimedia/codex'

import ArticleHeader from '@/components/article/ArticleHeader.vue'
import ArticleRenderer from '@/components/article/ArticleRenderer.vue'
import ChromeWrapper from '@/components/chrome/ChromeWrapper.vue'

import SavePagesSheet from '../components/SavePagesSheet.vue'
import { useArticleHtml } from '../data/useArticleHtml'
import type { FlowState } from '../data/useFlowState'

const props = defineProps<{ flow: FlowState }>()

const MAIN_PAGE_TITLE = 'Main Page'
const effectiveTitle = computed(() => props.flow.title.value.trim() || MAIN_PAGE_TITLE)
const displayTitle = computed(() => effectiveTitle.value.replace(/_/g, ' ').trim())
// The Main Page is the homepage landing — production hides the article header
// (title, tabs, icon toolbar) there, so we skip it without touching the shared
// ArticleHeader component.
const isMainPage = computed(() => effectiveTitle.value === MAIN_PAGE_TITLE)
const saveSheetOpen = ref(false)

const { html, loading, error } = useArticleHtml(effectiveTitle)

function onBookmark(): void {
  saveSheetOpen.value = true
}

function onSearch(): void {
  props.flow.goTo('search')
}
</script>

<template>
  <ChromeWrapper skin="mobile" @search="onSearch">
    <article class="article nd-article" data-skin="mobile">
      <ArticleHeader
        v-if="!isMainPage"
        :title="displayTitle"
        skin="mobile"
        bookmark-affordance="bookmark"
        @bookmark-click="onBookmark"
      />

      <CdxProgressBar v-if="loading" inline aria-label="Loading article" />

      <CdxMessage v-if="error" type="error" :allow-user-dismiss="false">
        Couldn't load this article: {{ error }}
      </CdxMessage>

      <ArticleRenderer v-if="html !== null" skin="mobile">
        <!-- eslint-disable-next-line vue/no-v-html -->
        <div v-html="html" />
      </ArticleRenderer>

      <SavePagesSheet v-model:open="saveSheetOpen" :flow="props.flow" />
    </article>
  </ChromeWrapper>
</template>

<style scoped>
.nd-article {
  box-sizing: border-box;
  width: 100%;
  padding: var(--spacing-150, 24px) var(--spacing-100, 16px) var(--spacing-100, 16px);
  background-color: var(--background-color-base);
  text-align: start;
}
</style>
