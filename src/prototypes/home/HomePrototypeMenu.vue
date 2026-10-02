<script setup lang="ts">
/**
 * The header's ☰ main menu on every Home page, holding home2's one item:
 * "Reset prototype", for starting a test session over.
 */
import { ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { CdxIcon, CdxMenuButton, type MenuItemValue } from '@wikimedia/codex'
import { cdxIconMenu } from '@wikimedia/codex-icons'

import { HOME_PATH } from './routes'

const MENU_ITEMS = [{ value: 'reset', label: 'Reset prototype' }]

const route = useRoute()
const router = useRouter()
const selected = ref<MenuItemValue | null>(null)

/*
 * Everything this browser stored (home2): ProtoWiki's settings too, not just the
 * Home's. Then a fresh load of the logged-out Main Page, where the splash shows
 * again. A test link's pinned `?skin=` / `?theme=` carry over.
 */
function resetPrototype(): void {
  try {
    window.localStorage.clear()
  } catch {
    // Unavailable storage — the reload still starts logged out.
  }
  const query: Record<string, string> = { user: 'logged-out' }
  for (const key of ['skin', 'theme']) {
    const value = route.query[key]
    if (typeof value === 'string') query[key] = value
  }
  window.location.assign(router.resolve({ path: HOME_PATH, query }).href)
}

watch(selected, (value) => {
  if (value === null) return
  selected.value = null
  if (value === 'reset') resetPrototype()
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
