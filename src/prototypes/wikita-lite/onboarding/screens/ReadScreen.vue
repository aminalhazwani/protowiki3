<script setup lang="ts">
import { computed, ref } from 'vue'
import { CdxMessage, CdxProgressBar } from '@wikimedia/codex'

import ArticleHeader from '@/components/article/ArticleHeader.vue'
import ArticleRenderer from '@/components/article/ArticleRenderer.vue'
import ChromeHeader from '@/components/chrome/ChromeHeader.vue'
import type { HeaderItem } from '@/components/chrome/ChromeHeader.vue'
import ChromeWrapper from '@/components/chrome/ChromeWrapper.vue'

import SavePagesSheet from '../components/SavePagesSheet.vue'
import ReturnHomeBanner from '../components/ReturnHomeBanner.vue'
import { resolveArticleLink } from '../data/articleLinks'
import { useArticleHtml } from '../data/useArticleHtml'
import type { FlowState, OnboardingScreen } from '../data/useWikitaLiteOnboardingFlow'

const props = defineProps<{ flow: FlowState }>()

const MAIN_PAGE_TITLE = 'Main Page'
const effectiveTitle = computed(() => props.flow.title.value.trim() || MAIN_PAGE_TITLE)
const displayTitle = computed(() => effectiveTitle.value.replace(/_/g, ' ').trim())
const isMainPage = computed(() => effectiveTitle.value === MAIN_PAGE_TITLE)
const saveSheetOpen = ref(false)
const saveSheetVisible = ref(false)
const articleHeaderRef = ref<InstanceType<typeof ArticleHeader> | null>(null)
const bookmarkAnchor = computed(() => articleHeaderRef.value?.bookmarkAnchor ?? null)

const { html, loading, error } = useArticleHtml(effectiveTitle)

function onBookmark(): void {
  if (!isMainPage.value) {
    void props.flow.patch({ saveTitle: displayTitle.value })
  }
  saveSheetVisible.value = true
  saveSheetOpen.value = true
}

function onSaveSheetNavigate(screen: OnboardingScreen): void {
  saveSheetVisible.value = false
  void props.flow.goTo(screen)
}

function onSaveSheetClosed(): void {
  saveSheetVisible.value = false
}

function onSearch(): void {
  void props.flow.goTo('search')
}

const headerRight: HeaderItem[] = [
  { type: 'button', icon: 'search', label: 'Search', onClick: onSearch },
  { type: 'button', icon: 'bell-outline', label: 'Notifications' },
  { type: 'button', icon: 'user-avatar-outline', label: 'User menu' },
]

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
  <div class="read-screen">
    <ChromeWrapper skin="mobile" :last-edited-notice="false">
      <template #header>
        <ChromeHeader skin="mobile" :right="headerRight" :brand-link="false" />
      </template>

      <ReturnHomeBanner :flow="props.flow" />
      <article class="article nd-article" data-skin="mobile">
        <ArticleHeader
          v-if="!isMainPage"
          ref="articleHeaderRef"
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
      </article>
    </ChromeWrapper>

    <SavePagesSheet
      v-if="saveSheetVisible"
      v-model:open="saveSheetOpen"
      :anchor="bookmarkAnchor"
      @navigate="onSaveSheetNavigate"
      @closed="onSaveSheetClosed"
    />
  </div>
</template>

<style scoped>
.read-screen {
  position: relative;
  display: flex;
  flex-direction: column;
  box-sizing: border-box;
  min-height: 100vh;
  min-height: 100dvh;
}

.nd-article {
  box-sizing: border-box;
  width: 100%;
  padding: var(--spacing-150, 24px) var(--spacing-100, 16px) var(--spacing-100, 16px);
  background-color: var(--background-color-base);
  text-align: start;
}
</style>
