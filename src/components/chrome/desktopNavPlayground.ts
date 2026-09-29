import type { Ref } from 'vue'

import { presetEnumKnob, presetFlagKnob, presetKnobs } from './playgroundPresets'

/**
 * Desktop-only knobs for the Vector tool cluster, offered in the main-menu
 * playground beside the Home button and sticky header controls: whether Home
 * sits in the cluster, where the username surfaces, and whether alerts and
 * notices share a button.
 *
 * All round-trip through the URL (`?homeInToolbar=`, `?usernameIn=`,
 * `?mergeNotices=`) so a configured toolbar can be shared as a link, starting
 * from the active playground preset.
 */

/**
 * Where the logged-in username appears. Mutually exclusive by construction —
 * the name shows up in exactly one place — so the playground offers radios
 * rather than a switch per position.
 *
 * - `menu` — nowhere in the bar; only as the first row of the user menu.
 * - `toolbar` — Vector's own meta link, just before the tool icons.
 * - `button` — the label of the user-menu button that closes the cluster.
 * - `button-bare` — the same label, with the avatar icon dropped: the name and
 *   the chevron alone. The name already says whose menu it is, so the avatar is
 *   the one thing in the cluster that repeats itself.
 * - `button-initials` — the name's first two letters in the avatar's place,
 *   with the chevron. Too short to name the account on its own, so the menu
 *   keeps the full name as its first row, and the button's accessible name is
 *   the full name too.
 * - `home` — the label of the Home button, in place of “Home”: one button for
 *   the reader's own corner of the wiki. The user button goes back to the bare
 *   avatar, and the menu drops its user-page row as it does for `toolbar`.
 *   Needs Home in the cluster — without it the name shows nowhere.
 */
export const USERNAME_PLACEMENTS = [
  'menu',
  'toolbar',
  'button',
  'button-bare',
  'button-initials',
  'home',
] as const

export type UsernamePlacement = (typeof USERNAME_PLACEMENTS)[number]

/** Reader-facing wording for the radios; the values above stay terse for URLs. */
export const USERNAME_PLACEMENT_LABELS: Record<UsernamePlacement, string> = {
  menu: 'Inside the user menu',
  toolbar: 'In the toolbar',
  button: 'As the menu button label',
  'button-bare': 'As the menu button label (w/o icon)',
  'button-initials': 'Initials as the menu button label',
  home: 'As the Home button label',
}

/** A preset's starting point for the cluster. */
export interface DesktopNavDefaults {
  /** Home in the cluster — needs `home` in `navTools` to have a button to show. */
  showHome: boolean
  placement: UsernamePlacement
  mergeNotices: boolean
}

export interface DesktopNavPlayground {
  showHome: Ref<boolean>
  usernamePlacement: Ref<UsernamePlacement>
  /** Fold notices into the alerts button, leaving one bell instead of two icons. */
  mergeNotices: Ref<boolean>
}

export function useDesktopNavPlayground(): DesktopNavPlayground {
  const defaults = () => presetKnobs().desktopNav

  return {
    showHome: presetFlagKnob('homeInToolbar', () => defaults().showHome),
    usernamePlacement: presetEnumKnob(
      'usernameIn',
      USERNAME_PLACEMENTS,
      () => defaults().placement,
    ),
    mergeNotices: presetFlagKnob('mergeNotices', () => defaults().mergeNotices),
  }
}
