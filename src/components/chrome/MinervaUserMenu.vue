<script setup lang="ts">
// PROTOWIKI+ (Home) Minerva's user menu — ported from home2 (MinervaUserMenu + AccountMenuPopover).
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { CdxButton, CdxIcon, CdxMenu } from '@wikimedia/codex'
import type { MenuItemData, MenuItemValue } from '@wikimedia/codex'
import {
  cdxIconBookmarkList,
  cdxIconLogIn,
  cdxIconLogOut,
  cdxIconSandbox,
  cdxIconUserAvatar,
  cdxIconUserAvatarOutline,
  cdxIconUserContributions,
  cdxIconUserTalk,
  cdxIconWatchlist,
} from '@wikimedia/codex-icons'

import { useConfig } from '@/composables/useConfig'
import { accountActions } from './accountActions'

/**
 * Minerva's avatar button with the user menu hanging off it: the account's
 * pages when logged in, Create account / Log in when logged out. Rows are
 * inert mocks, except "Log out" and "Create account" when the page registered
 * `accountActions`.
 */
const { user, displayName } = useConfig()

const open = ref(false)
const menu = ref<InstanceType<typeof CdxMenu> | null>(null)
const trigger = ref<InstanceType<typeof CdxButton> | null>(null)
const selection = ref<MenuItemValue | null>(null)

const menuItems = computed((): MenuItemData[] =>
  user.value === 'logged-out'
    ? [
        { value: 'create-account', label: 'Create account', icon: cdxIconUserAvatar },
        { value: 'log-in', label: 'Log in', icon: cdxIconLogIn },
      ]
    : [
        { value: 'user-page', label: displayName.value, icon: cdxIconUserAvatar },
        { value: 'talk', label: 'Talk', icon: cdxIconUserTalk },
        { value: 'sandbox', label: 'Sandbox', icon: cdxIconSandbox },
        { value: 'saved', label: 'Saved', icon: cdxIconBookmarkList },
        { value: 'watchlist', label: 'Watchlist', icon: cdxIconWatchlist },
        { value: 'contributions', label: 'Contributions', icon: cdxIconUserContributions },
        { value: 'log-out', label: 'Log out', icon: cdxIconLogOut },
      ],
)

// A pick closes the menu (Codex); clear it so no row keeps the selected treatment.
watch(selection, (value) => {
  if (value === null) return
  selection.value = null
  if (value === 'log-out') accountActions.value?.logOut?.()
  if (value === 'create-account') accountActions.value?.createAccount?.open()
})

/* Rows are `<li>`s: arrow keys, Enter and Escape reach them through the focused
   trigger, as in CdxMenuButton. */
function onKeydown(event: KeyboardEvent): void {
  if (event.key === ' ') return
  menu.value?.delegateKeyNavigation(event)
}

/*
 * Codex rows swallow `mousedown`, so a tap on a row never blurs the trigger,
 * and Safari doesn't focus buttons on click: closing on an outside tap needs
 * its own listener rather than the trigger's `blur`.
 */
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
  <!-- Positioning context: the menu hangs 4px under the avatar, flush with its end edge. -->
  <span class="minerva-user-menu">
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
      class="minerva-user-menu__menu"
      :menu-items="menuItems"
      role="menu"
      aria-label="User menu"
    />
  </span>
</template>

<style scoped>
.minerva-user-menu {
  position: relative;
  display: inline-flex;
}

/*
 * CODEX+ CdxMenu: sits at `left: 0` at its container's full width, with no
 * placement option. `inset-inline-end` keeps it flush with the avatar (and
 * mirrors in RTL); it sizes to its rows.
 */
.minerva-user-menu :deep(.minerva-user-menu__menu.cdx-menu) {
  top: 100%;
  left: auto;
  inset-inline-end: 0;
  width: max-content;
  min-width: 13rem;
  max-width: calc(100vw - var(--spacing-100, 16px) * 2);
  margin-top: var(--spacing-25, 4px);
}

/* CODEX+ CdxMenuItem: no large size. Thumb-sized rows, against Codex's denser 38px. */
.minerva-user-menu :deep(.minerva-user-menu__menu .cdx-menu-item) {
  padding: var(--spacing-75, 12px) var(--spacing-100, 16px);
}

/* Minerva draws the rows in the bar's subtle grey; the semi-bold labels carry the emphasis. */
.minerva-user-menu :deep(.minerva-user-menu__menu .cdx-menu-item--enabled),
.minerva-user-menu :deep(.minerva-user-menu__menu .cdx-menu-item--enabled .cdx-menu-item__content) {
  color: var(--color-subtle, #54595d);
}

.minerva-user-menu :deep(.minerva-user-menu__menu .cdx-menu-item__icon.cdx-icon) {
  margin-inline-end: var(--spacing-75, 12px);
  color: var(--color-subtle, #54595d);
}

.minerva-user-menu :deep(.minerva-user-menu__menu .cdx-menu-item__text__label) {
  font-weight: var(--font-weight-semi-bold, 600);
}
</style>
