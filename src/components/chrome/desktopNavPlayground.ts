import { ref, watch, type Ref } from 'vue'

import {
  readEnumParam,
  readFlagParam,
  syncPlaygroundFlag,
  syncPlaygroundParam,
} from './playgroundParams'

/**
 * Desktop-only knobs for the Vector tool cluster, offered in the main-menu
 * playground beside the Home button and sticky header controls: where the
 * username surfaces, and whether alerts and notices share a button.
 *
 * Both round-trip through the URL (`?usernameIn=`, `?mergeNotices=`) so a
 * configured toolbar can be shared as a link.
 */

/**
 * Where the logged-in username appears. Mutually exclusive by construction —
 * the name shows up in exactly one place — so the playground offers radios
 * rather than a switch per position.
 *
 * - `menu` — nowhere in the bar; only as the first row of the user menu.
 * - `toolbar` — Vector's own meta link, just before the tool icons.
 * - `button` — the label of the user-menu button that closes the cluster.
 */
export const USERNAME_PLACEMENTS = ['menu', 'toolbar', 'button'] as const

export type UsernamePlacement = (typeof USERNAME_PLACEMENTS)[number]

/** Reader-facing wording for the radios; the values above stay terse for URLs. */
export const USERNAME_PLACEMENT_LABELS: Record<UsernamePlacement, string> = {
  menu: 'Inside the user menu',
  toolbar: 'In the toolbar',
  button: 'As the menu button label',
}

/** Per-surface starting point — what the cluster looks like with a bare URL. */
export interface DesktopNavDefaults {
  placement: UsernamePlacement
  mergeNotices: boolean
}

export interface DesktopNavPlayground {
  usernamePlacement: Ref<UsernamePlacement>
  /** Fold notices into the alerts button, leaving one bell instead of two icons. */
  mergeNotices: Ref<boolean>
}

export function useDesktopNavPlayground(defaults: DesktopNavDefaults): DesktopNavPlayground {
  const usernamePlacement = ref<UsernamePlacement>(
    readEnumParam('usernameIn', USERNAME_PLACEMENTS, defaults.placement),
  )
  const mergeNotices = ref(readFlagParam('mergeNotices', defaults.mergeNotices))

  watch(usernamePlacement, (value) =>
    syncPlaygroundParam('usernameIn', value, value === defaults.placement),
  )
  watch(mergeNotices, (value) => syncPlaygroundFlag('mergeNotices', value, defaults.mergeNotices))

  return { usernamePlacement, mergeNotices }
}
