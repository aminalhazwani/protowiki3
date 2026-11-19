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
      <li class="nav-main-menu__caption" aria-hidden="true">Navigation proposal</li>
      <li
        v-for="(item, index) in NAV_VARIANTS"
        :key="item.id"
        class="minerva-chrome-main-menu__item"
      >
        <a
          class="minerva-chrome-main-menu__anchor"
          :href="variantHref(item.id)"
          role="menuitemradio"
          :aria-checked="variant === item.id"
          @click="onVariantClick($event, item.id)"
        >
          <CdxIcon
            class="minerva-chrome-main-menu__icon nav-main-menu__check"
            :class="{ 'nav-main-menu__check--hidden': variant !== item.id }"
            :icon="cdxIconCheck"
          />
          <span class="minerva-chrome-main-menu__label">
            <span class="nav-main-menu__number">{{ index + 1 }}</span>
            {{ item.label }}
          </span>
        </a>
      </li>
    </template>
  </MinervaChromeMainMenu>
</template>

<style scoped>
/* Names the switcher, in the drawer's own small grey type. */
.nav-main-menu__caption {
  padding: var(--spacing-75) 0.875em var(--spacing-25);
  color: var(--color-subtle);
  font-size: var(--font-size-x-small);
  font-weight: var(--font-weight-normal);
  line-height: var(--line-height-x-small);
}

/* Every row keeps the check's room, so labels line up whichever is picked. */
.nav-main-menu__check--hidden {
  visibility: hidden;
}

.nav-main-menu__check:not(.nav-main-menu__check--hidden) {
  color: var(--color-progressive);
}

.nav-main-menu__number {
  margin-inline-end: var(--spacing-25);
  font-weight: var(--font-weight-normal);
}
</style>
