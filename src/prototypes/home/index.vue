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
import ChromeWrapper from '@/components/chrome/ChromeWrapper.vue'
</script>

<template>
  <ChromeWrapper>
    <!-- The Main Page changes daily, so skip the persistent article cache. -->
    <ArticleLive article="Main_Page" :persist-cache="false" />
  </ChromeWrapper>
</template>
