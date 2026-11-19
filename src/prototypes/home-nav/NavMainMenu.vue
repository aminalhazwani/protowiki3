<script setup lang="ts">
/**
 * The ☰ drawer: Minerva's signed-in rows (with Home on top in the "Home in
 * menu" variant), and the variant switcher pinned to its foot. Only Home and
 * the switcher go anywhere; every other row is inert.
 */
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { CdxIcon } from '@wikimedia/codex'
import {
  cdxIconCheck,
  cdxIconDie,
  cdxIconHome,
  cdxIconMapPin,
  cdxIconNewspaper,
  cdxIconRecentChanges,
  cdxIconSettings,
  cdxIconSpecialPages,
  cdxIconSpeechBubbles,
} from '@wikimedia/codex-icons'

import { mergedLocationQuery } from '@/appearance/url-query'
import MinervaChromeMainMenu from '@/components/chrome/MinervaChromeMainMenu.vue'
import type { MinervaMainMenuRow } from '@/components/chrome/minervaMainMenu'

import { HOME_NAV_HOME_PATH, NAV_VARIANTS, useNavVariant, type NavVariant } from './navVariants'

const route = useRoute()
const router = useRouter()
const { variant, setVariant } = useNavVariant()

const groups = computed((): MinervaMainMenuRow[][] => {
  const result: MinervaMainMenuRow[][] = []
  if (variant.value === 'menu') {
    result.push([{ id: 'home', label: 'Home', icon: cdxIconHome, to: HOME_NAV_HOME_PATH }])
  }
  result.push(
    [
      { id: 'main-page', label: 'Main Page', icon: cdxIconNewspaper },
      { id: 'random', label: 'Random', icon: cdxIconDie },
      { id: 'nearby', label: 'Nearby', icon: cdxIconMapPin },
    ],
    [
      { id: 'recent-changes', label: 'Recent changes', icon: cdxIconRecentChanges },
      { id: 'special-pages', label: 'Special pages', icon: cdxIconSpecialPages },
      { id: 'community-portal', label: 'Community portal', icon: cdxIconSpeechBubbles },
    ],
    [{ id: 'settings', label: 'Settings', icon: cdxIconSettings }],
  )
  return result
})

function variantHref(id: NavVariant): string {
  const query = mergedLocationQuery(route.query, { nav: id })
  return router.resolve({ path: route.path, query }).href
}

function onVariantClick(event: MouseEvent, id: NavVariant): void {
  if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return
  event.preventDefault()
  setVariant(id)
}
</script>

<template>
  <MinervaChromeMainMenu :groups="groups">
    <template #prototype-footer>
      <li v-for="item in NAV_VARIANTS" :key="item.id" class="minerva-chrome-main-menu__item">
        <a
          class="minerva-chrome-main-menu__anchor"
          :href="variantHref(item.id)"
          role="menuitemradio"
          :aria-checked="variant === item.id"
          @click="onVariantClick($event, item.id)"
        >
          <span class="minerva-chrome-main-menu__label">{{ item.label }}</span>
          <CdxIcon
            v-if="variant === item.id"
            class="minerva-chrome-main-menu__icon nav-main-menu__check"
            :icon="cdxIconCheck"
          />
        </a>
      </li>
    </template>
  </MinervaChromeMainMenu>
</template>

<style scoped>
/* The picked variant's check sits at the row's end. */
.minerva-chrome-main-menu__icon.nav-main-menu__check {
  margin-inline-start: auto;
  color: var(--color-progressive);
}
</style>
