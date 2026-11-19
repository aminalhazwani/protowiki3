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
import { useWikiPageTitleQuery } from '@/composables/useWikiPageTitleQuery'

import NavChrome from './NavChrome.vue'
import { HOME_NAV_PATH } from './navVariants'

const DEFAULT_ARTICLE = 'Bruno Munari'

const { titleFromQuery, setWikiPageTitle } = useWikiPageTitleQuery()

/** `?title=` when present, otherwise Bruno Munari. */
const article = computed(() => titleFromQuery.value ?? DEFAULT_ARTICLE)

function onTitleResolved(title: string) {
  if (title?.trim()) setWikiPageTitle(title)
}
</script>

<template>
  <NavChrome>
    <ArticleLive
      edit-route=""
      saved-pages-route=""
      :wiki-link-route="HOME_NAV_PATH"
      :article="article"
      collapse-sections
      @title-resolved="onTitleResolved"
    />
  </NavChrome>
</template>
