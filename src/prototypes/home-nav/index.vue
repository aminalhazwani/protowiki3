<script setup lang="ts">
definePage({
  meta: {
    platform: 'web',
    // Opens as Minerva + New user whatever the visitor saved in Settings
    // (their settings stay untouched) — see `@/appearance/route-pins`.
    skin: 'mobile',
    user: 'new',
  },
})

import { computed } from 'vue'

import ArticleLive from '@/components/article/ArticleLive.vue'
import ChromeWrapper from '@/components/chrome/ChromeWrapper.vue'
import { useWikiPageTitleQuery } from '@/composables/useWikiPageTitleQuery'
import {
  SAVED_PAGES_TEMPLATE_PATH,
  VISUAL_EDITOR_TEMPLATE_PATH,
} from '@/composables/webTemplatePaths'

/** This prototype's own route, so in-article wiki links stay here. */
const HOME_NAV_PATH = '/home-nav'

const DEFAULT_ARTICLE = 'Bruno Munari'

const { titleFromQuery, setWikiPageTitle } = useWikiPageTitleQuery()

/** `?title=` when present, otherwise Bruno Munari. */
const article = computed(() => titleFromQuery.value ?? DEFAULT_ARTICLE)

function onTitleResolved(title: string) {
  if (title?.trim()) setWikiPageTitle(title)
}
</script>

<template>
  <ChromeWrapper :saved-pages-route="SAVED_PAGES_TEMPLATE_PATH">
    <ArticleLive
      :edit-route="VISUAL_EDITOR_TEMPLATE_PATH"
      :wiki-link-route="HOME_NAV_PATH"
      :saved-pages-route="SAVED_PAGES_TEMPLATE_PATH"
      :article="article"
      @title-resolved="onTitleResolved"
    />
  </ChromeWrapper>
</template>
