<script setup lang="ts">
import { computed } from 'vue'

import ChromeHeader from '@/components/chrome/ChromeHeader.vue'
import type { ChromeNavTool } from '@/components/chrome/headerNavTools'

import { useWikitaLiteArticleOpener } from '../composables/useWikitaLiteArticleOpener'
import { useWikitaLiteChromeHeaderRight } from '../composables/useWikitaLiteChromeHeaderRight'
import { useWikitaLiteUrlState } from '../composables/useWikitaLiteUrlState'
import { useWikitaLiteView } from '../composables/useWikitaLiteView'
import WikitaLitePrototypeMenuPopover from './WikitaLitePrototypeMenuPopover.vue'

/**
 * Chrome for the logged-in side of the prototype — Home and the article pages
 * reached from its search. On desktop, Home leads the Vector tool cluster and
 * the account's name labels the user menu; the other tools are inert mocks.
 * Mobile keeps the Minerva bar from `useWikitaLiteChromeHeaderRight`.
 */
const LOGGED_IN_NAV_TOOLS: ChromeNavTool[] = [
  'home',
  'appearance',
  'notifications',
  'notices',
  'bookmarks',
  'watchlist',
  'user-menu',
]

const { state } = useWikitaLiteUrlState()
const { goHome } = useWikitaLiteView()
const { headerRight } = useWikitaLiteChromeHeaderRight()

// Search in this header opens its results in the prototype, still logged in.
useWikitaLiteArticleOpener()

/** Empty falls back to the mock user's display name inside the chrome. */
const username = computed(() => state.value.displayName || state.value.username)
</script>

<template>
  <ChromeHeader
    :right="headerRight"
    :brand-link="false"
    :nav-tools="LOGGED_IN_NAV_TOOLS"
    :username="username"
    @home="goHome"
  >
    <template #menu>
      <WikitaLitePrototypeMenuPopover />
    </template>
  </ChromeHeader>
</template>
