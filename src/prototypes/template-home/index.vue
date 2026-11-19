<script setup lang="ts">
import { cdxIconHome } from '@wikimedia/codex-icons'

import ChromeWrapper from '@/components/chrome/ChromeWrapper.vue'
import HomeDashboard from './HomeDashboard.vue'

definePage({
  meta: {
    title: 'Home',
    description: 'Template for prototyping Home.',
    category: 'template',
    platform: 'web',
    order: 5.5,
    icon: cdxIconHome,
  },
})
</script>

<template>
  <ChromeWrapper :last-edited-notice="false">
    <HomeDashboard />
  </ChromeWrapper>
</template>
