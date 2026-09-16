<script setup lang="ts">
definePage({
  meta: {
    title: 'Home navigation',
    description: 'Design explorations for helping people getting back to their Home.',
    category: 'prototype',
    platform: 'web',
  },
})

import { computed, nextTick, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import ArticleLive from '@/components/article/ArticleLive.vue'
import ArticleSnapshot from '@/components/article/ArticleSnapshot.vue'
import { registerArticleOpener } from '@/components/article/shared/articleOpener'
import { sameWikiTitle, wikiLinkClick } from '@/components/article/shared/wikiLinkClick'
import ChromeWrapper from '@/components/chrome/ChromeWrapper.vue'
import type { ChromeNavTool } from '@/components/chrome/headerNavTools'

/**
 * Home leads the cluster in place of the username link; reading lists sits after
 * Notices, and the user icon is a menu rather than a plain button.
 *
 * `username=""` is what starts the name in the user menu only — the desktop
 * variants that move it into the toolbar or onto the menu button, and the one
 * that folds notices into the alerts bell, live in the main-menu playground
 * (`?usernameIn=`, `?mergeNotices=`).
 */
const navTools: ChromeNavTool[] = [
  'home',
  'appearance',
  'notifications',
  'notices',
  'bookmarks',
  'watchlist',
  'user-menu',
]

/** The article the prototype opens on — and the one it has a committed snapshot for. */
const SEED_ARTICLE = 'Earth'

const route = useRoute()
const router = useRouter()

/**
 * Reading position lives in `?article=`, so link clicks are real history
 * entries: browser back walks the reading trail the same way the Home
 * affordances under test are meant to short-circuit it.
 */
const article = computed(() => {
  const value = route.query.article
  return typeof value === 'string' && value.trim().length ? value.trim() : SEED_ARTICLE
})

/** The snapshot is committed for the seed article only; everything clicked into is live. */
const fromSnapshot = computed(() => sameWikiTitle(article.value, SEED_ARTICLE))

/** Where `title` lives in this prototype: the same page, reading it instead. */
function articleLocation(title: string) {
  return { path: route.path, query: { ...route.query, article: title }, hash: route.hash }
}

function openArticle(title: string): void {
  void router.push(articleLocation(title))
}

/**
 * Chrome search lands here too, so a suggestion opens the article on this page
 * rather than sending the reader off to en.wikipedia.org — the reading trail
 * the Home affordances are meant to short-circuit has to include the pages you
 * *searched* your way into, not just the ones you clicked into.
 */
registerArticleOpener({
  href: (title) => router.resolve(articleLocation(title)).href,
  open: openArticle,
})

/**
 * Article HTML carries relative Parsoid hrefs (`./Mars`), so every on-wiki link
 * is broken navigation inside a prototype — both wiki cases stop here, and only
 * a readable article moves the prototype. External links (references, sister
 * sites) keep their default behaviour and leave.
 */
function onArticleClick(event: MouseEvent): void {
  if (event.defaultPrevented || event.button !== 0) return

  const link = wikiLinkClick(event)
  if (!link) return

  event.preventDefault()
  if (link.kind !== 'article') return

  if (sameWikiTitle(link.title, article.value)) {
    // A self-link with a fragment (`./Earth#Orbit`) is an in-page jump.
    if (link.fragment) document.getElementById(link.fragment)?.scrollIntoView()
    return
  }

  openArticle(link.title)
}

// A query-only navigation doesn't scroll, and the incoming article is a fresh
// page as far as the reader is concerned.
watch(article, () => {
  void nextTick(() => {
    window.scrollTo({ top: 0 })
  })
})
</script>

<template>
  <ChromeWrapper :nav-tools="navTools" username="">
    <ArticleSnapshot
      v-if="fromSnapshot"
      class="article"
      :article="SEED_ARTICLE"
      @click="onArticleClick"
    />
    <ArticleLive v-else class="article" :article="article" @click="onArticleClick" />
  </ChromeWrapper>
</template>
