<script setup lang="ts">
definePage({
  meta: {
    title: 'Mobile toolbar',
    description: 'Mobile web global, and article toolbar',
    category: 'prototype',
    platform: 'web',
  },
})

import ArticleSnapshot from '@/components/article/ArticleSnapshot.vue'
import TabBarPage from './TabBarPage.vue'
</script>

<template>
  <TabBarPage variant="article">
    <ArticleSnapshot class="article" article="Wet Leg" />
  </TabBarPage>
</template>

<style scoped>
/* Prototype-only: the bottom toolbar takes over page actions, so hide the header's icon row. */
:deep(.article-header__toolbar) {
  padding-top: var(--spacing-100, 16px)!important;
}

:deep(.article-header__icon-toolbar) {
  display: none;
}

:deep(.article-header__tab.article-header__tab--active) {
  display: none;
}

:deep(.article-header__tab) {
  display: none;
}
</style>
