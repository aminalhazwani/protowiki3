import type { Ref } from 'vue'

import { presetFlagKnob, presetKnobs } from './playgroundPresets'

/**
 * Minerva-only knobs for the top bar's end cluster, in the main-menu playground
 * beside the floating-button controls: whether Home takes the notifications
 * bell's seat, and whether the unread count shows.
 *
 * Both round-trip through the URL (`?barHome=`, `?notifCount=`), starting from
 * the active playground preset.
 */

/**
 * The mock unread count. Like Home's, it's a single digit and stays out of the
 * URL — what matters is that there *is* one, not how many.
 */
export const NOTIFICATION_COUNT = 1

/** A preset's starting point for the bar. */
export interface MobileBarDefaults {
  /**
   * Home in the bell's seat, between search and the avatar. Notifications
   * doesn't disappear: it moves into the user menu, between Talk and Sandbox.
   */
  homeInBar: boolean
  /**
   * Echo's unread count, in red, on the avatar and on the user menu's
   * Notifications row — so only while notifications live in the menu.
   */
  notificationCount: boolean
}

export interface MobileBarPlayground {
  homeInBar: Ref<boolean>
  notificationCount: Ref<boolean>
}

export function useMobileBarPlayground(): MobileBarPlayground {
  const defaults = () => presetKnobs().mobileBar

  return {
    homeInBar: presetFlagKnob('barHome', () => defaults().homeInBar),
    notificationCount: presetFlagKnob('notifCount', () => defaults().notificationCount),
  }
}
