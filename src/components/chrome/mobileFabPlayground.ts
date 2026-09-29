import type { Ref } from 'vue'

import { presetFlagKnob, presetKnobs } from './playgroundPresets'

/**
 * Minerva-only knobs for the floating corner cluster, beside the Home styling
 * controls in the main-menu playground: whether Home floats at all, how the
 * cluster behaves on scroll, and how help relates to Home on the pages that
 * offer it.
 *
 * All round-trip through the URL (`?fabHome=`, `?fabHideOnScroll=`,
 * `?helpMatchHome=`, `?homeOnHelp=`), starting from the active playground
 * preset.
 */

/** A preset's starting point for the cluster. */
export interface MobileFabDefaults {
  /** Float Home in the corner. Off, the cluster is help alone, on the pages that show it. */
  showHome: boolean
  /** Slide the cluster out below the viewport on scroll down, back in on scroll up. */
  hideOnScroll: boolean
  /**
   * Help wears Home's action / weight / size / roundness, so the two read as a
   * pair. Off, help is its own button: progressive, normal, large and round.
   */
  helpMatchesHome: boolean
  /** Keep Home in the cluster on pages that show help; off, help takes its place. */
  homeOnHelpPages: boolean
}

export interface MobileFabPlayground {
  showHome: Ref<boolean>
  hideOnScroll: Ref<boolean>
  helpMatchesHome: Ref<boolean>
  homeOnHelpPages: Ref<boolean>
}

export function useMobileFabPlayground(): MobileFabPlayground {
  const defaults = () => presetKnobs().mobileFabs

  return {
    showHome: presetFlagKnob('fabHome', () => defaults().showHome),
    hideOnScroll: presetFlagKnob('fabHideOnScroll', () => defaults().hideOnScroll),
    helpMatchesHome: presetFlagKnob('helpMatchHome', () => defaults().helpMatchesHome),
    homeOnHelpPages: presetFlagKnob('homeOnHelp', () => defaults().homeOnHelpPages),
  }
}
