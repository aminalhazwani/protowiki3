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
import HomeDashboard from './HomeDashboard.vue'
import { useHomeAccount } from './useHomeAccount'
import { useHomeArticleLinks } from './useHomeArticleLinks'

/*
 * Logged out: the real Main Page. Signed in (any other Mock user preset): the
 * Home. Test links: `?user=logged-out|new|experienced|real`, plus the Home's
 * own `?username=` / `?reset` (see `data/homeUrlParams.ts`).
 */
const { isLoggedIn } = useHomeAccount()
const { onArticleClick } = useHomeArticleLinks(() => 'Main Page')
</script>

<template>
  <HomeChrome :last-edited-notice="!isLoggedIn">
    <HomeDashboard v-if="isLoggedIn" />
    <div v-else @click="onArticleClick">
      <!-- The Main Page changes daily, so skip the persistent article cache. -->
      <ArticleLive article="Main_Page" main-page :persist-cache="false" />
    </div>
  </HomeChrome>
</template>
