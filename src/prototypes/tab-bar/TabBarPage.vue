<script setup lang="ts">
import { computed } from 'vue'

import ChromeFooter from '@/components/chrome/ChromeFooter.vue'
import ChromeWrapper from '@/components/chrome/ChromeWrapper.vue'
import { useConfig } from '@/composables/useConfig'
import MobileToolbar from './MobileToolbar.vue'
import { ARTICLE_TOOLBAR, GLOBAL_TOOLBAR } from './toolbarItems'
import { useForceUserPreset } from './useForceUserPreset'

interface Props {
  /** Which toolbar to show: **`global`** (homepage) or **`article`**. */
  variant: 'global' | 'article'
  /** Forwarded to **`ChromeWrapper`** / **`ChromeFooter`**. */
  lastEditedNotice?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  lastEditedNotice: true,
})

const { displayName } = useConfig()
useForceUserPreset('experienced')

const items = computed(() => (props.variant === 'global' ? GLOBAL_TOOLBAR : ARTICLE_TOOLBAR))
</script>

<template>
  <ChromeWrapper :last-edited-notice="props.lastEditedNotice">
    <slot />

    <template #footer>
      <ChromeFooter :last-edited-notice="props.lastEditedNotice" :username="displayName" />
      <MobileToolbar :items="items" />
    </template>
  </ChromeWrapper>
</template>
