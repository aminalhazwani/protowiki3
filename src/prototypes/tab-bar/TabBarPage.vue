<script setup lang="ts">
import { computed, ref } from 'vue'

import ChromeFooter from '@/components/chrome/ChromeFooter.vue'
import ChromeHeader from '@/components/chrome/ChromeHeader.vue'
import ChromeWrapper from '@/components/chrome/ChromeWrapper.vue'
import type { HeaderItem } from '@/components/header/headerItems'
import { useConfig } from '@/composables/useConfig'
import CustomizeToolbarsDialog from './CustomizeToolbarsDialog.vue'
import MobileToolbar from './MobileToolbar.vue'
import { buildArticleItems, buildGlobalItems } from './toolbarItems'
import { toolbarStore } from './toolbarStore'
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

const customizeOpen = ref(false)

// Minerva header items; the user-avatar button opens the Customize Toolbars dialog.
const headerRight: HeaderItem[] = [
  { type: 'button', icon: 'search', label: 'Search' },
  { type: 'button', icon: 'bell-outline', label: 'Notifications' },
  {
    type: 'button',
    icon: 'user-avatar-outline',
    label: 'Customize toolbars',
    onClick: () => {
      customizeOpen.value = true
    },
  },
]

const items = computed(() =>
  props.variant === 'global'
    ? buildGlobalItems(toolbarStore.global, true)
    : buildArticleItems(toolbarStore.article),
)
</script>

<template>
  <ChromeWrapper :last-edited-notice="props.lastEditedNotice">
    <template #header>
      <ChromeHeader :username="displayName" :right="headerRight" />
    </template>

    <slot />
    <CustomizeToolbarsDialog v-model:open="customizeOpen" />

    <template #footer>
      <ChromeFooter :last-edited-notice="props.lastEditedNotice" :username="displayName" />
      <MobileToolbar :items="items" />
    </template>
  </ChromeWrapper>
</template>
