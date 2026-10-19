<script setup lang="ts">
/**
 * The header's ☰. On Minerva it's the skin's main menu drawer — markup, sizes
 * and motion from production (`#mw-mf-page-left`), signed in or out — with
 * "Prototype settings" and "Reset prototype" pinned to its bottom. On Vector
 * it stays the small prototype menu (`HomePrototypeMenu`).
 *
 * Main Page / Home, Random and Nearby stay in the prototype; every other row
 * is a real Wikipedia link, which `HomeChrome` asks about before leaving.
 * Advanced mode (Prototype settings) adds Minerva's editor links when signed in.
 */
import { computed, nextTick, onBeforeUnmount, ref, watch } from 'vue'
import { useRoute, useRouter, type RouteLocationRaw } from 'vue-router'
import { CdxButton, CdxIcon } from '@wikimedia/codex'
import {
  cdxIconDie,
  cdxIconHome,
  cdxIconLabFlask,
  cdxIconLogIn,
  cdxIconMapPin,
  cdxIconMenu,
  cdxIconNewspaper,
  cdxIconRecentChanges,
  cdxIconReload,
  cdxIconSettings,
  cdxIconSpecialPages,
  cdxIconSpeechBubbles,
  cdxIconUserAvatar,
  type Icon,
} from '@wikimedia/codex-icons'

import { accountActions } from '@/components/chrome/accountActions'
import { useConfig } from '@/composables/useConfig'
import { globalSkin } from '@/theme'

import { fetchRandomTitle } from './data/fetchRandomTitle'
import HomePrototypeMenu from './HomePrototypeMenu.vue'
import HomePrototypeSettingsDialog from './HomePrototypeSettingsDialog.vue'
import { HOME_PATH, homeArticleLocation, MAIN_PAGE_PATH } from './routes'
import { useHomeAccount } from './useHomeAccount'
import { useHomeAdvancedMode } from './useHomeAdvancedMode'
import { useHomeResetPrototype } from './useHomeResetPrototype'

interface MenuRow {
  id: string
  label: string
  icon?: Icon
  /** In the prototype. */
  to?: RouteLocationRaw
  /** Off the prototype: a real Wikipedia page. */
  href?: string
  /** An action rather than a page. */
  action?: () => void
}

const route = useRoute()
const router = useRouter()
const { lang } = useConfig()
const { isLoggedIn } = useHomeAccount()
const { advancedMode } = useHomeAdvancedMode()
const { resetPrototype } = useHomeResetPrototype()

const isMobile = computed(() => globalSkin.value === 'mobile')
const open = ref(false)
const settingsOpen = ref(false)
const trigger = ref<InstanceType<typeof CdxButton> | null>(null)
const panel = ref<HTMLElement | null>(null)

/** A page on the reader's Wikipedia (mobile site, as Minerva links). */
function wiki(title: string): string {
  return `https://${lang.value}.m.wikipedia.org/wiki/${encodeURIComponent(title.replace(/ /g, '_')).replace(/%3A/gi, ':')}`
}

async function openRandom(): Promise<void> {
  const title = await fetchRandomTitle(lang.value)
  if (title) void router.push(homeArticleLocation(title))
}

/** Production's groups, top to bottom; each is a white block on the grey panel. */
const groups = computed<MenuRow[][]>(() => {
  const navigation: MenuRow[] = [
    isLoggedIn.value
      ? { id: 'main-page', label: 'Main Page', icon: cdxIconNewspaper, to: MAIN_PAGE_PATH }
      : { id: 'home', label: 'Home', icon: cdxIconHome, to: HOME_PATH },
    { id: 'random', label: 'Random', icon: cdxIconDie, action: openRandom },
    {
      id: 'nearby',
      label: 'Nearby',
      icon: cdxIconMapPin,
      to: homeArticleLocation('Special:Nearby'),
    },
  ]
  const result = [navigation]

  if (isLoggedIn.value && advancedMode.value) {
    result.push([
      {
        id: 'recent-changes',
        label: 'Recent changes',
        icon: cdxIconRecentChanges,
        href: wiki('Special:RecentChanges'),
      },
      {
        id: 'special-pages',
        label: 'Special pages',
        icon: cdxIconSpecialPages,
        href: wiki('Special:SpecialPages'),
      },
      {
        id: 'community-portal',
        label: 'Community portal',
        icon: cdxIconSpeechBubbles,
        href: wiki('Wikipedia:Community portal'),
      },
    ])
  }

  if (!isLoggedIn.value) {
    const createAccount = accountActions.value?.createAccount
    result.push([
      {
        id: 'create-account',
        label: 'Create account',
        icon: cdxIconUserAvatar,
        ...(createAccount ? { action: createAccount.open } : { href: wiki('Special:CreateAccount') }),
      },
      { id: 'log-in', label: 'Log in', icon: cdxIconLogIn, href: wiki('Special:UserLogin') },
    ])
  }

  result.push([
    { id: 'settings', label: 'Settings', icon: cdxIconSettings, href: wiki('Special:MobileOptions') },
  ])
  return result
})

/** About · Disclaimers, under the groups. */
const FOOTER_LINKS = [
  { id: 'about', label: 'About Wikipedia', title: 'Wikipedia:About' },
  { id: 'disclaimers', label: 'Disclaimers', title: 'Wikipedia:General disclaimer' },
]

const donateHref = computed(
  () =>
    `https://donate.wikimedia.org/?wmf_source=donate&wmf_medium=sidebar&wmf_campaign=${lang.value}.wikipedia.org&uselang=${lang.value}&wmf_key=minerva`,
)

function rowHref(row: MenuRow): string | undefined {
  if (row.to) return router.resolve(row.to).href
  return row.href
}

function close(): void {
  open.value = false
}

/**
 * Prototype rows navigate in place; off-prototype links keep their default,
 * which `HomeChrome`'s capture handler has already turned into the leave dialog.
 */
function onRowClick(event: MouseEvent, row: MenuRow): void {
  if (row.to || row.action) {
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return
    event.preventDefault()
  }
  close()
  if (row.action) row.action()
  else if (row.to) void router.push(row.to)
}

function openSettings(): void {
  close()
  settingsOpen.value = true
}

function onKeydown(event: KeyboardEvent): void {
  if (event.key === 'Escape') close()
}

watch(open, async (isOpen) => {
  // Production doesn't scroll the page under the menu; nor do we.
  document.documentElement.style.overflow = isOpen ? 'hidden' : ''
  if (isOpen) {
    document.addEventListener('keydown', onKeydown)
    await nextTick()
    panel.value?.querySelector<HTMLElement>('a, button')?.focus({ preventScroll: true })
  } else {
    document.removeEventListener('keydown', onKeydown)
    ;(trigger.value?.$el as HTMLElement | undefined)?.focus({ preventScroll: true })
  }
})

// A new page closes the menu (Random resolves after it's gone).
watch(() => route.fullPath, close)
// Desktop has no drawer.
watch(isMobile, (mobile) => !mobile && close())

onBeforeUnmount(() => {
  document.documentElement.style.overflow = ''
  document.removeEventListener('keydown', onKeydown)
})
</script>

<template>
  <HomePrototypeMenu v-if="!isMobile" />
  <template v-else>
    <CdxButton
      ref="trigger"
      class="home-main-menu__trigger"
      weight="quiet"
      aria-label="Main menu"
      :aria-expanded="open"
      aria-controls="home-main-menu"
      @click="open = !open"
    >
      <CdxIcon :icon="cdxIconMenu" />
    </CdxButton>

    <div
      class="home-main-menu__mask"
      :class="{ 'home-main-menu__mask--open': open }"
      aria-hidden="true"
      @click="close"
    />

    <nav
      id="home-main-menu"
      ref="panel"
      class="home-main-menu"
      :class="{ 'home-main-menu--open': open }"
      aria-label="Main menu"
      :inert="!open"
    >
      <div class="home-main-menu__scroll">
        <ul v-for="(group, index) in groups" :key="index" class="home-main-menu__list">
          <li v-for="row in group" :key="row.id" class="home-main-menu__item">
            <a
              class="home-main-menu__anchor"
              :href="rowHref(row) ?? '#'"
              :role="row.action ? 'button' : undefined"
              @click="onRowClick($event, row)"
            >
              <CdxIcon v-if="row.icon" class="home-main-menu__icon" :icon="row.icon" />
              <span class="home-main-menu__label">{{ row.label }}</span>
            </a>
          </li>
        </ul>

        <!-- Production shows the donate banner to logged-out readers only. -->
        <div v-if="!isLoggedIn" class="home-main-menu__donate">
          <a class="home-main-menu__donate-link" :href="donateHref" @click="close">
            <span class="home-main-menu__donate-text">
              <span class="home-main-menu__donate-title">Donate Now</span>
              <span class="home-main-menu__donate-subtitle">
                If Wikipedia is useful to you, please give today.
              </span>
            </span>
            <picture>
              <source
                srcset="https://en.wikipedia.org/static/images/donate/donate.png"
                media="(prefers-reduced-motion)"
              />
              <img
                class="home-main-menu__donate-gif"
                src="https://en.wikipedia.org/static/images/donate/donate.gif"
                alt=""
                loading="lazy"
              />
            </picture>
          </a>
        </div>

        <ul class="home-main-menu__list home-main-menu__list--hlist">
          <li v-for="link in FOOTER_LINKS" :key="link.id">
            <a class="home-main-menu__anchor" :href="wiki(link.title)" @click="close">
              <span class="home-main-menu__label">{{ link.label }}</span>
            </a>
          </li>
        </ul>
      </div>

      <!-- The prototype's own controls, pinned under Minerva's menu. -->
      <ul class="home-main-menu__list home-main-menu__prototype">
        <li class="home-main-menu__item">
          <button type="button" class="home-main-menu__anchor" @click="openSettings">
            <CdxIcon class="home-main-menu__icon" :icon="cdxIconLabFlask" />
            <span class="home-main-menu__label">Prototype settings</span>
          </button>
        </li>
        <li class="home-main-menu__item">
          <button
            type="button"
            class="home-main-menu__anchor home-main-menu__anchor--destructive"
            @click="resetPrototype"
          >
            <CdxIcon class="home-main-menu__icon" :icon="cdxIconReload" />
            <span class="home-main-menu__label">Reset prototype</span>
          </button>
        </li>
      </ul>
    </nav>

    <HomePrototypeSettingsDialog v-model:open="settingsOpen" />
  </template>
</template>

<style scoped>
/*
 * Minerva's main menu, from production (`#mw-mf-page-left`, `.main-menu-mask`,
 * `.toggle-list-item`, `.donate-banner`), on Codex tokens.
 */
.home-main-menu {
  position: fixed;
  top: 0;
  bottom: 0;
  left: 0;
  z-index: var(--z-index-off-canvas);
  display: flex;
  flex-direction: column;
  box-sizing: border-box;
  min-width: 275px;
  max-width: 80%;
  background-color: var(--background-color-interactive);
  visibility: hidden;
  transform: translate(-100%, 0);
  transition:
    visibility 250ms ease-in-out,
    transform 250ms ease-in-out;
}

.home-main-menu--open {
  visibility: visible;
  box-shadow: var(--box-shadow-medium);
  transform: translate(0, 0);
}

@media screen and (min-width: 640px) {
  .home-main-menu {
    min-width: 320px;
  }
}

.home-main-menu__mask {
  position: fixed;
  inset: 0;
  z-index: var(--z-index-off-canvas-backdrop);
  background: rgba(0, 0, 0, 0.8);
  opacity: 0;
  visibility: hidden;
  transition:
    opacity 100ms ease-in-out,
    visibility 0ms linear 100ms;
}

.home-main-menu__mask--open {
  opacity: 0.5;
  visibility: visible;
  transition: opacity 100ms ease-in-out;
}

/* Reduced motion: the menu appears in place; the mask still fades. */
@media (prefers-reduced-motion: reduce) {
  .home-main-menu {
    transition: visibility 0ms;
  }
}

/* Minerva's menu scrolls; the prototype block stays put under it. */
.home-main-menu__scroll {
  flex: 1 1 auto;
  min-height: 0;
  overflow-y: auto;
}

.home-main-menu__list {
  margin: 0;
  padding: 0 0 22px;
  list-style: none;
}

.home-main-menu__item {
  position: relative;
  margin: -1px 0 0;
  border-top: 1px solid var(--border-color-muted);
  background-color: var(--background-color-base);
}

.home-main-menu__item:first-child {
  margin-top: 0;
  border-top: 0;
}

.home-main-menu__anchor {
  display: flex;
  align-items: center;
  gap: 6px;
  box-sizing: border-box;
  width: 100%;
  padding: 0.75em 0.875em;
  border: 0;
  background: none;
  font: inherit;
  text-align: start;
  text-decoration: none;
  cursor: pointer;
}

.home-main-menu__anchor:hover {
  text-decoration: none;
}

@media (hover: hover) and (pointer: fine) {
  .home-main-menu__item .home-main-menu__anchor:hover {
    box-shadow: inset 4px 0 0 0 var(--box-shadow-color-progressive--focus);
  }
}

.home-main-menu__icon {
  flex-shrink: 0;
  color: var(--color-subtle);
}

.home-main-menu__label {
  overflow: hidden;
  color: var(--color-subtle);
  font-size: 0.875rem;
  font-weight: bold;
  /* The icon's height, so a row is production's 44px. */
  line-height: var(--size-icon-medium, 20px);
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* About · Disclaimers: plain labels on the grey. */
.home-main-menu__list--hlist {
  display: flex;
  flex-wrap: wrap;
}

.home-main-menu__list--hlist .home-main-menu__anchor {
  padding: 0.7em 12px;
}

.home-main-menu__list--hlist .home-main-menu__label {
  font-weight: normal;
}

.home-main-menu__donate {
  margin-bottom: 22px;
  padding: 0.75em 0.875em;
  background-color: var(--background-color-base);
  font-size: 0.875rem;
  font-weight: bold;
}

.home-main-menu__donate-link {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  text-decoration: none;
}

.home-main-menu__donate-text {
  display: flex;
  flex-direction: column;
  flex-grow: 1;
  max-width: 200px;
}

.home-main-menu__donate-title {
  margin-bottom: 15px;
  color: var(--color-progressive);
}

.home-main-menu__donate-subtitle {
  color: var(--color-subtle);
  font-weight: normal;
}

.home-main-menu__donate-gif {
  flex-shrink: 0;
  width: 75px;
}

/* The prototype's controls: Minerva rows, set off from the menu by a rule. */
.home-main-menu__prototype {
  flex-shrink: 0;
  padding-bottom: 0;
  border-top: 1px solid var(--border-color-muted);
}

.home-main-menu__anchor--destructive .home-main-menu__icon,
.home-main-menu__anchor--destructive .home-main-menu__label {
  color: var(--color-destructive);
}
</style>
