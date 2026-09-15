<script setup lang="ts">
definePage({
  meta: {
    title: 'Home navigation',
    description: 'Design explorations for helping people getting back to their Home.',
    category: 'prototype',
    platform: 'web',
  },
})

import ArticleSnapshot from '@/components/article/ArticleSnapshot.vue'
import ChromeWrapper from '@/components/chrome/ChromeWrapper.vue'
import type { ChromeNavTool } from '@/components/chrome/headerNavTools'

/**
 * Home leads the cluster in place of the username link; reading lists sits after
 * Notices, and the user icon is a menu rather than a plain button.
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
</script>

<template>
  <ChromeWrapper :nav-tools="navTools" username="">
    <ArticleSnapshot class="article" article="Earth" />
  </ChromeWrapper>
</template>
