<script setup lang="ts">
import { computed, ref } from 'vue'
import { CdxMessage, CdxProgressBar } from '@wikimedia/codex'

import ArticleHeader from '@/components/article/ArticleHeader.vue'
import ArticleRenderer from '@/components/article/ArticleRenderer.vue'
import ChromeWrapper from '@/components/chrome/ChromeWrapper.vue'

import OnboardingChromeHeader from '../components/OnboardingChromeHeader.vue'
import SavePagesSheet from '../components/SavePagesSheet.vue'
import ReturnHomeBanner from '../components/ReturnHomeBanner.vue'
import { resolveArticleLink } from '../data/articleLinks'
import { useArticleHtml } from '../data/useArticleHtml'
import { useReturnHomeBanner } from '../data/useReturnHomeBanner'
import type { FlowState } from '../data/useWikitaLiteOnboardingFlow'

const props = defineProps<{ flow: FlowState }>()

const { dismiss: dismissReturnHomeBanner } = useReturnHomeBanner()

const MAIN_PAGE_TITLE = 'Main Page'
const effectiveTitle = computed(() => props.flow.title.value.trim() || MAIN_PAGE_TITLE)
const displayTitle = computed(() => effectiveTitle.value.replace(/_/g, ' ').trim())
const isMainPage = computed(() => effectiveTitle.value === MAIN_PAGE_TITLE)
const saveSheetOpen = ref(false)

const { html, loading, error } = useArticleHtml(effectiveTitle)

function onBookmark(): void {
  saveSheetOpen.value = true
}

function onSearch(): void {
  props.flow.goTo('search')
}

function onCreateAccount(): void {
  props.flow.goTo('account')
}

function onGoHome(): void {
  dismissReturnHomeBanner()
  void props.flow.goTo('home')
}

function onArticleLinkClick(event: MouseEvent): void {
  const anchor = (event.target as HTMLElement).closest('a')
  if (!anchor) return

  const target = resolveArticleLink(anchor)
  if (target.kind === 'in-page') return

  event.preventDefault()
  if (target.kind === 'inert') return

  const sameArticle = target.title.replace(/_/g, ' ') === displayTitle.value
  if (sameArticle) {
    if (target.fragment) {
      document.getElementById(target.fragment)?.scrollIntoView({ block: 'center' })
    }
    return
  }

  void props.flow.goTo('read', { title: target.title })
}
</script>

<template>
  <ChromeWrapper skin="mobile" :last-edited-notice="false">
    <template #header>
      <OnboardingChromeHeader
        mode="read"
        :username="flow.username.value || undefined"
        @search="onSearch"
        @create-account="onCreateAccount"
        @go-home="onGoHome"
      />
    </template>

    <ReturnHomeBanner :flow="props.flow" />
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

      <ArticleRenderer v-if="html !== null" skin="mobile" @click="onArticleLinkClick">
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
