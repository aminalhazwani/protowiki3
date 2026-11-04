<script setup lang="ts">
/**
 * The header's ☰ main menu, holding the prototype's scenarios: each starts
 * the Home over from where that scenario begins.
 */
import { ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { CdxIcon, CdxMenuButton, type MenuItemValue } from '@wikimedia/codex'
import { cdxIconMenu } from '@wikimedia/codex-icons'

import { preservedQueryFromLocationQuery } from '@/appearance/url-query'

import { HOME_PATH } from './homeRoutes'
import { useFindingSuggestions } from './useFindingSuggestions'

const MENU_ITEMS = [
  {
    label: 'Scenarios',
    items: [{ value: 'account-setup', label: 'From account setup' }],
  },
]

const route = useRoute()
const router = useRouter()
const { startFromAccountSetup } = useFindingSuggestions()
const selected = ref<MenuItemValue | null>(null)

watch(selected, (value) => {
  if (value === null) return
  selected.value = null
  if (value === 'account-setup') {
    startFromAccountSetup()
    if (route.path !== HOME_PATH) {
      void router.push({ path: HOME_PATH, query: preservedQueryFromLocationQuery(route.query) })
    }
  }
})
</script>

<template>
  <CdxMenuButton
    v-model:selected="selected"
    class="prototype-chrome-menu-popover"
    :menu-items="MENU_ITEMS"
    weight="quiet"
    aria-label="Main menu"
  >
    <CdxIcon :icon="cdxIconMenu" />
  </CdxMenuButton>
</template>
