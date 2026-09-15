import { ref, watch, type Ref } from 'vue'

import { removeUrlQueryParam, syncUrlQueryParam } from '@/appearance/url-query'

/**
 * Shared state for the Home button styling playground the chrome headers expose
 * behind their main-menu button — the same knobs the Codex Button demo offers.
 *
 * Every setting round-trips through the URL (`?homeAction=`, `?homeWeight=`,
 * `?homeSize=`, `?homeIconOnly=`) so a configured header can be shared as a
 * link, and both skins read the same params: flipping `?skin=` keeps whatever
 * was configured. Params are written only when they differ from the defaults
 * the calling skin passes in, keeping clean URLs.
 */
export const HOME_ACTIONS = ['default', 'progressive', 'destructive'] as const
export const HOME_WEIGHTS = ['normal', 'primary', 'quiet'] as const
/** `small` is Codex's icon-only size — it clips a visible label. */
export const HOME_SIZES = ['small', 'medium', 'large'] as const

export type HomeAction = (typeof HOME_ACTIONS)[number]
export type HomeWeight = (typeof HOME_WEIGHTS)[number]
export type HomeSize = (typeof HOME_SIZES)[number]

/** Per-skin starting point — what the button looks like with a bare URL. */
export interface HomeButtonDefaults {
  action: HomeAction
  weight: HomeWeight
  size: HomeSize
  iconOnly: boolean
}

export interface HomeButtonPlayground {
  action: Ref<HomeAction>
  weight: Ref<HomeWeight>
  size: Ref<HomeSize>
  iconOnly: Ref<boolean>
}

function readParam(key: string): string | null {
  if (typeof window === 'undefined') return null
  return new URLSearchParams(window.location.search).get(key)
}

function readEnumParam<T extends string>(key: string, allowed: readonly T[], fallback: T): T {
  const value = readParam(key)
  return allowed.includes(value as T) ? (value as T) : fallback
}

/**
 * Booleans need both states spelled out: the two skins disagree on the default,
 * so “absent” can't stand in for `false` the way it can for a single skin.
 */
function readFlagParam(key: string, fallback: boolean): boolean {
  const value = readParam(key)
  if (value === '1') return true
  if (value === '0') return false
  return fallback
}

export function useHomeButtonPlayground(defaults: HomeButtonDefaults): HomeButtonPlayground {
  const action = ref<HomeAction>(readEnumParam('homeAction', HOME_ACTIONS, defaults.action))
  const weight = ref<HomeWeight>(readEnumParam('homeWeight', HOME_WEIGHTS, defaults.weight))
  const size = ref<HomeSize>(readEnumParam('homeSize', HOME_SIZES, defaults.size))
  const iconOnly = ref(readFlagParam('homeIconOnly', defaults.iconOnly))

  function syncParam(key: string, value: string, isDefault: boolean) {
    if (isDefault) removeUrlQueryParam(key)
    else syncUrlQueryParam(key, value)
  }

  watch(action, (value) => syncParam('homeAction', value, value === defaults.action))
  watch(weight, (value) => syncParam('homeWeight', value, value === defaults.weight))
  watch(size, (value) => syncParam('homeSize', value, value === defaults.size))
  watch(iconOnly, (value) =>
    syncParam('homeIconOnly', value ? '1' : '0', value === defaults.iconOnly),
  )

  return { action, weight, size, iconOnly }
}
