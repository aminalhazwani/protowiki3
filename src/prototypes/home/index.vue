<script setup lang="ts">
definePage({
  meta: {
    title: 'Home',
    description:
      'A demo where you go through onboarding after account creation, and then land on a personalized Home.',
    platform: 'web',
  },
})
import ArticleLive from '@/components/article/ArticleLive.vue'

import HomeChrome from './HomeChrome.vue'
import { useHomeArticleLinks } from './useHomeArticleLinks'

const { onArticleClick } = useHomeArticleLinks(() => 'Main Page')
</script>

<template>
  <HomeChrome>
    <div @click="onArticleClick">
      <!-- The Main Page changes daily, so skip the persistent article cache. -->
      <ArticleLive article="Main_Page" main-page :persist-cache="false" />
    </div>
  </HomeChrome>
</template>
