import { ref, watch, type Ref } from 'vue'

import {
  readEnumParam,
  readFlagParam,
  syncPlaygroundFlag,
  syncPlaygroundParam,
} from './playgroundParams'

/**
 * Shared state for the Home button styling playground the chrome headers expose
 * behind their main-menu button — the same knobs the Codex Button demo offers.
 *
 * Every setting round-trips through the URL (`?homeAction=`, `?homeWeight=`,
 * `?homeSize=`, `?homeIconOnly=`, `?homeRound=`, `?homeCount=`) so a configured
 * header can be shared as a link, and both skins read the same params: flipping
 * `?skin=` keeps whatever was configured. Params are written only when they
 * differ from the defaults the calling skin passes in, keeping clean URLs.
 */
export const HOME_ACTIONS = ['default', 'progressive', 'destructive'] as const
export const HOME_WEIGHTS = ['normal', 'primary', 'quiet'] as const
/** `small` is Codex's icon-only size — it clips a visible label. */
export const HOME_SIZES = ['small', 'medium', 'large'] as const

/**
 * What the count badge shows. A mock like the rest of the chrome: Home has no
 * inbox behind it, and what would be counted — new suggested edits, unseen
 * impact, mentor replies — is the question the exploration is asking, so the
 * number stays a single digit and out of the URL.
 */
export const HOME_BUTTON_COUNT = 1

export type HomeAction = (typeof HOME_ACTIONS)[number]
export type HomeWeight = (typeof HOME_WEIGHTS)[number]
export type HomeSize = (typeof HOME_SIZES)[number]

/** Per-skin starting point — what the button looks like with a bare URL. */
export interface HomeButtonDefaults {
  action: HomeAction
  weight: HomeWeight
  size: HomeSize
  iconOnly: boolean
  /** Trade the button's 2px corners for `border-radius-circle`. */
  round: boolean
  /** Echo's count badge, pinned to the Home icon — see {@link HOME_BUTTON_COUNT}. */
  count: boolean
}

export interface HomeButtonPlayground {
  action: Ref<HomeAction>
  weight: Ref<HomeWeight>
  size: Ref<HomeSize>
  iconOnly: Ref<boolean>
  round: Ref<boolean>
  count: Ref<boolean>
}

export function useHomeButtonPlayground(defaults: HomeButtonDefaults): HomeButtonPlayground {
  const action = ref<HomeAction>(readEnumParam('homeAction', HOME_ACTIONS, defaults.action))
  const weight = ref<HomeWeight>(readEnumParam('homeWeight', HOME_WEIGHTS, defaults.weight))
  const size = ref<HomeSize>(readEnumParam('homeSize', HOME_SIZES, defaults.size))
  const iconOnly = ref(readFlagParam('homeIconOnly', defaults.iconOnly))
  const round = ref(readFlagParam('homeRound', defaults.round))
  const count = ref(readFlagParam('homeCount', defaults.count))

  watch(action, (value) => syncPlaygroundParam('homeAction', value, value === defaults.action))
  watch(weight, (value) => syncPlaygroundParam('homeWeight', value, value === defaults.weight))
  watch(size, (value) => syncPlaygroundParam('homeSize', value, value === defaults.size))
  watch(iconOnly, (value) => syncPlaygroundFlag('homeIconOnly', value, defaults.iconOnly))
  watch(round, (value) => syncPlaygroundFlag('homeRound', value, defaults.round))
  watch(count, (value) => syncPlaygroundFlag('homeCount', value, defaults.count))

  return { action, weight, size, iconOnly, round, count }
}

/**
 * Accessible name for a Home button, which the count changes: a badge is
 * `aria-hidden` (a bare number out of context tells a screen reader nothing),
 * so the button says the number itself — and says it whether or not the label
 * is visible, since the visible text alone would leave the badge unannounced.
 * `undefined` where the visible label is already the accessible name.
 */
export function homeButtonAriaLabel(
  label: string,
  iconOnly: boolean,
  count: boolean,
): string | undefined {
  if (count) return `${label} (${HOME_BUTTON_COUNT})`
  return iconOnly ? label : undefined
}
