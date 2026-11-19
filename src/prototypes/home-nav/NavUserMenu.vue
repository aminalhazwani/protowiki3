<script setup lang="ts">
/**
 * Minerva's user menu, signed in: the account's name (the way to the Home in
 * every variant), then its pages. Only the name and Saved pages go anywhere;
 * the other rows are inert. "Home in tab bar" drops Saved pages, which the tab
 * bar already offers. Ported from `home-renovation`'s `MinervaUserMenu`.
 */
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { CdxButton, CdxIcon, CdxMenu } from '@wikimedia/codex'
import type { MenuItemData, MenuItemValue } from '@wikimedia/codex'
import {
  cdxIconBookmarkList,
  cdxIconLogOut,
  cdxIconSandbox,
  cdxIconUserAvatar,
  cdxIconUserAvatarOutline,
  cdxIconUserContributions,
  cdxIconUserTalk,
  cdxIconWatchlist,
} from '@wikimedia/codex-icons'

import {
  HOME_NAV_HOME_PATH,
  HOME_NAV_SAVED_PATH,
  HOME_NAV_USERNAME,
  useNavVariant,
} from './navVariants'

const router = useRouter()

const open = ref(false)
const menu = ref<InstanceType<typeof CdxMenu> | null>(null)
const trigger = ref<InstanceType<typeof CdxButton> | null>(null)
const selection = ref<MenuItemValue | null>(null)

const { variant } = useNavVariant()

const ALL_ITEMS: MenuItemData[] = [
  { value: 'user-page', label: HOME_NAV_USERNAME, icon: cdxIconUserAvatar },
  { value: 'talk', label: 'Talk', icon: cdxIconUserTalk },
  { value: 'sandbox', label: 'Sandbox', icon: cdxIconSandbox },
  { value: 'saved', label: 'Saved pages', icon: cdxIconBookmarkList },
  { value: 'watchlist', label: 'Watchlist', icon: cdxIconWatchlist },
  { value: 'contributions', label: 'Contributions', icon: cdxIconUserContributions },
  { value: 'log-out', label: 'Logout', icon: cdxIconLogOut },
]

/* With the tab bar, Saved is one of its tabs, so the menu leaves it out. */
const menuItems = computed(() =>
  variant.value === 'tab-bar' ? ALL_ITEMS.filter((item) => item.value !== 'saved') : ALL_ITEMS,
)

// A pick closes the menu (Codex); clear it so no row keeps the selected treatment.
watch(selection, (value) => {
  if (value === null) return
  selection.value = null
  if (value === 'user-page') void router.push(HOME_NAV_HOME_PATH)
  if (value === 'saved') void router.push(HOME_NAV_SAVED_PATH)
})

/* Rows are `<li>`s: arrow keys, Enter and Escape reach them through the focused trigger. */
function onKeydown(event: KeyboardEvent): void {
  if (event.key === ' ') return
  menu.value?.delegateKeyNavigation(event)
}

/* Codex rows swallow `mousedown`, so closing on an outside tap needs its own listener. */
function onDocumentPointerDown(event: PointerEvent): void {
  const target = event.target as Node | null
  if (!target) return
  if (menu.value?.getRootElement()?.contains(target)) return
  if (trigger.value?.$el?.contains(target)) return
  open.value = false
}

watch(open, (isOpen) => {
  if (isOpen) document.addEventListener('pointerdown', onDocumentPointerDown)
  else document.removeEventListener('pointerdown', onDocumentPointerDown)
})

onBeforeUnmount(() => document.removeEventListener('pointerdown', onDocumentPointerDown))
</script>

<template>
  <span class="nav-user-menu">
    <CdxButton
      ref="trigger"
      weight="quiet"
      size="large"
      aria-label="User menu"
      aria-haspopup="menu"
      :aria-expanded="open"
      @click="open = !open"
      @keydown="onKeydown"
    >
      <CdxIcon :icon="cdxIconUserAvatarOutline" size="medium" />
    </CdxButton>
    <CdxMenu
      ref="menu"
      v-model:selected="selection"
      v-model:expanded="open"
      class="nav-user-menu__menu"
      :menu-items="menuItems"
      role="menu"
      aria-label="User menu"
    />
  </span>
</template>

<style scoped>
.nav-user-menu {
  position: relative;
  display: inline-flex;
}

/* CODEX+ CdxMenu: no placement option — hang it under the avatar, flush with its end edge. */
.nav-user-menu :deep(.nav-user-menu__menu.cdx-menu) {
  top: 100%;
  left: auto;
  inset-inline-end: 0;
  width: max-content;
  min-width: 13rem;
  max-width: calc(100vw - var(--spacing-100, 16px) * 2);
  margin-top: var(--spacing-25, 4px);
}

/* CODEX+ CdxMenuItem: no large size. Thumb-sized rows, as Minerva's. */
.nav-user-menu :deep(.nav-user-menu__menu .cdx-menu-item) {
  padding: var(--spacing-75, 12px) var(--spacing-100, 16px);
}

.nav-user-menu :deep(.nav-user-menu__menu .cdx-menu-item--enabled),
.nav-user-menu :deep(.nav-user-menu__menu .cdx-menu-item--enabled .cdx-menu-item__content) {
  color: var(--color-subtle, #54595d);
}

/* CODEX+ CdxMenuItem: no bold option. Minerva's user menu labels are bold. */
.nav-user-menu :deep(.nav-user-menu__menu .cdx-menu-item__text__label) {
  font-weight: var(--font-weight-bold);
}

.nav-user-menu :deep(.nav-user-menu__menu .cdx-menu-item__icon.cdx-icon) {
  margin-inline-end: var(--spacing-75, 12px);
  color: var(--color-subtle, #54595d);
}
</style>
