import { effectScope, ref, watch, type Ref } from 'vue'
import type { MenuItemData } from '@wikimedia/codex'

import { applyWebSkinPreference, globalSkin, type Skin } from '@/theme'
import type { DesktopNavDefaults } from './desktopNavPlayground'
import type { HomeButtonDefaults } from './homeButtonPlayground'
import type { MobileBarDefaults } from './mobileBarPlayground'
import type { MobileFabDefaults } from './mobileFabPlayground'
import { readEnumParam, readFlagParam, syncPlaygroundParam } from './playgroundParams'
import type { StickyHeaderDefaults } from './stickyHeaderPlayground'

/**
 * Named starting points for the main-menu playground: production and the two
 * treatments under test, per platform. The select heads both panels, and a
 * preset is a whole configuration — the skin it names plus a value for every
 * knob below it:
 *
 * - **The skin follows the preset.** Picking a mobile preset on a desktop
 *   viewport switches the page to Minerva (and pins it there, so resizing no
 *   longer flips it back); a skin change from anywhere else — the viewport
 *   crossing 640px, the settings panel — moves the preset to that platform's
 *   production entry, so the two never disagree.
 * - **Knobs are deltas on the preset.** Each knob starts from the preset's value
 *   and writes its URL param only when it differs from it, so `?preset=` alone
 *   reproduces a configuration and any extra param is a deliberate tweak.
 *   Picking a preset resets every knob to its value.
 *
 * With no `?preset=`, the page opens on production for the skin it booted on —
 * the viewport's, unless `?skin=` or the settings panel pinned one.
 */
export const PLAYGROUND_PRESETS = [
  'production-desktop',
  'treatment-1-desktop',
  'treatment-2-desktop',
  'production-mobile',
  'treatment-1-mobile',
  'treatment-2-mobile',
] as const

export type PlaygroundPreset = (typeof PLAYGROUND_PRESETS)[number]

export const PLAYGROUND_PRESET_ITEMS: MenuItemData[] = [
  { value: 'production-desktop', label: 'Production desktop' },
  { value: 'treatment-1-desktop', label: 'Treatment 1 desktop' },
  { value: 'treatment-2-desktop', label: 'Treatment 2 desktop' },
  { value: 'production-mobile', label: 'Production mobile' },
  { value: 'treatment-1-mobile', label: 'Treatment 1 mobile' },
  { value: 'treatment-2-mobile', label: 'Treatment 2 mobile' },
]

/**
 * Every knob's URL param. A preset switch clears them all in one go, before the
 * skin changes: the header a skin switch unmounts never gets to run its own
 * reset, and the one it mounts reads its knobs straight from the URL.
 */
export const PLAYGROUND_KNOB_PARAMS = [
  'homeAction',
  'homeWeight',
  'homeSize',
  'homeIconOnly',
  'homeRound',
  'homeCount',
  'homeInToolbar',
  'usernameIn',
  'mergeNotices',
  'stickyHome',
  'stickyLangCountOnly',
  'fabHome',
  'fabHideOnScroll',
  'helpMatchHome',
  'homeOnHelp',
  'barHome',
  'notifCount',
] as const

export type PlaygroundKnobParam = (typeof PLAYGROUND_KNOB_PARAMS)[number]

/** Every knob's value under a preset. Each skin ignores the other's groups. */
export interface PresetKnobs {
  home: HomeButtonDefaults
  desktopNav: DesktopNavDefaults
  sticky: StickyHeaderDefaults
  mobileFabs: MobileFabDefaults
  mobileBar: MobileBarDefaults
}

/**
 * Production desktop is Vector 2022 as it ships: no Home in the cluster, the
 * name as the toolbar's meta link, two Echo inboxes, a stock sticky bar. Home's
 * styling still has values — the sticky header's Home follows them when it's
 * switched back on.
 */
const PRODUCTION_DESKTOP: PresetKnobs = {
  home: {
    action: 'progressive',
    weight: 'quiet',
    size: 'medium',
    iconOnly: false,
    round: false,
    count: false,
  },
  desktopNav: { showHome: false, placement: 'toolbar', mergeNotices: false },
  sticky: { showHome: false, languagesCountOnly: false },
  mobileFabs: {
    showHome: true,
    hideOnScroll: false,
    helpMatchesHome: true,
    homeOnHelpPages: true,
  },
  mobileBar: { homeInBar: false, notificationCount: false },
}

/**
 * Treatment 1 trades the toolbar's name for Home: a labelled Home leads the
 * cluster, the name moves into the user menu as its first row (the user-page
 * link), and the menu button shows the name's first two letters instead of the
 * avatar.
 */
const TREATMENT_1_DESKTOP: PresetKnobs = {
  ...PRODUCTION_DESKTOP,
  desktopNav: { showHome: true, placement: 'button-initials', mergeNotices: false },
}

/**
 * Treatment 2 folds the toolbar's name into Home: the Home button carries the
 * username as its label, and the user menu is production's — avatar button, no
 * user-page row.
 */
const TREATMENT_2_DESKTOP: PresetKnobs = {
  ...PRODUCTION_DESKTOP,
  desktopNav: { showHome: true, placement: 'home', mergeNotices: false },
}

/**
 * Minerva floats Home over the article instead of seating it in a bar: framed
 * (`normal`), thumb-sized (`large`), icon-only and square-ish — a labelled pill
 * would cover more of the text it sits on. The base the mobile presets build
 * on: the cluster stays put, and help pairs with Home.
 */
const MOBILE: PresetKnobs = {
  ...PRODUCTION_DESKTOP,
  home: {
    action: 'default',
    weight: 'normal',
    size: 'large',
    iconOnly: true,
    round: false,
    count: false,
  },
}

/**
 * Production mobile floats no Home — Minerva has none — so the corner is
 * help's alone, on the pages that offer it: its own progressive, round button
 * rather than half of a pair. Home's styling keeps its values for when it's
 * switched back on.
 */
const PRODUCTION_MOBILE: PresetKnobs = {
  ...MOBILE,
  mobileFabs: {
    showHome: false,
    hideOnScroll: false,
    helpMatchesHome: false,
    homeOnHelpPages: true,
  },
}

/**
 * Treatment 1 floats Home but gets it out of the way: the cluster slides out on
 * scroll down and back on scroll up. On the pages that offer help, help joins
 * Home as its twin — same square, same styling.
 */
const TREATMENT_1_MOBILE: PresetKnobs = {
  ...MOBILE,
  mobileFabs: {
    showHome: true,
    hideOnScroll: true,
    helpMatchesHome: true,
    homeOnHelpPages: true,
  },
}

/**
 * Treatment 2 seats Home in the bar instead of floating it: Home takes the
 * bell's place, notifications move into the user menu between Talk and Sandbox,
 * and the unread count shows on the avatar and on that row. Scrolling and help
 * are production's — no floating Home, and a lone round help button.
 */
const TREATMENT_2_MOBILE: PresetKnobs = {
  ...PRODUCTION_MOBILE,
  mobileBar: { homeInBar: true, notificationCount: true },
}

export const PRESET_KNOBS: Record<PlaygroundPreset, PresetKnobs> = {
  'production-desktop': PRODUCTION_DESKTOP,
  'treatment-1-desktop': TREATMENT_1_DESKTOP,
  'treatment-2-desktop': TREATMENT_2_DESKTOP,
  'production-mobile': PRODUCTION_MOBILE,
  'treatment-1-mobile': TREATMENT_1_MOBILE,
  'treatment-2-mobile': TREATMENT_2_MOBILE,
}

export function presetSkin(preset: PlaygroundPreset): Skin {
  return preset.endsWith('-mobile') ? 'mobile' : 'desktop'
}

function productionPreset(skin: Skin): PlaygroundPreset {
  return skin === 'mobile' ? 'production-mobile' : 'production-desktop'
}

/**
 * One preset for the page, shared by both headers — switching it swaps one for
 * the other, and the choice has to survive the swap. Created on first use
 * rather than at import, so it reads the skin boot resolved rather than the
 * `desktop` placeholder `globalSkin` starts as.
 */
let activePreset: Ref<PlaygroundPreset> | null = null

export function usePlaygroundPreset(): Ref<PlaygroundPreset> {
  if (activePreset) return activePreset

  /** What a bare URL opens on; `?preset=` is written only when it differs. */
  const bootPreset = productionPreset(globalSkin.value)
  const preset = ref<PlaygroundPreset>(readEnumParam('preset', PLAYGROUND_PRESETS, bootPreset))
  activePreset = preset

  const applySkin = (value: PlaygroundPreset) => {
    const skin = presetSkin(value)
    if (skin !== globalSkin.value) applyWebSkinPreference(skin)
  }

  applySkin(preset.value)

  // Detached: the first caller is whichever header mounted first, and a preset
  // on the other platform unmounts it — the watchers have to outlive it.
  effectScope(true).run(() => {
    watch(preset, (value) => {
      syncPlaygroundParam('preset', value, value === bootPreset)
      for (const key of PLAYGROUND_KNOB_PARAMS) syncPlaygroundParam(key, '', true)
      applySkin(value)
    })

    watch(globalSkin, (skin) => {
      if (presetSkin(preset.value) !== skin) preset.value = productionPreset(skin)
    })
  })

  return preset
}

/** The active preset's knob values, for the playground composables' starting points. */
export function presetKnobs(): PresetKnobs {
  return PRESET_KNOBS[usePlaygroundPreset().value]
}

/**
 * A knob that starts from the active preset and snaps back to it whenever the
 * preset changes (the preset's own watcher has already dropped the param).
 */
function presetKnob<T>(
  key: PlaygroundKnobParam,
  read: (fallback: T) => T,
  serialize: (value: T) => string,
  fallback: () => T,
): Ref<T> {
  const knob = ref(read(fallback())) as Ref<T>

  watch(knob, (value) => syncPlaygroundParam(key, serialize(value), value === fallback()))

  watch(usePlaygroundPreset(), () => {
    knob.value = fallback()
  })

  return knob
}

export function presetEnumKnob<T extends string>(
  key: PlaygroundKnobParam,
  allowed: readonly T[],
  fallback: () => T,
): Ref<T> {
  return presetKnob(
    key,
    (value) => readEnumParam(key, allowed, value),
    (value) => value,
    fallback,
  )
}

/** Booleans spell both states out: presets disagree on the default. */
export function presetFlagKnob(key: PlaygroundKnobParam, fallback: () => boolean): Ref<boolean> {
  return presetKnob(
    key,
    (value) => readFlagParam(key, value),
    (value) => (value ? '1' : '0'),
    fallback,
  )
}
