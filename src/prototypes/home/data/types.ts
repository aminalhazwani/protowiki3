import type { Icon } from '@wikimedia/codex-icons'
import type { RouteLocationRaw } from 'vue-router'

/** A status pill above a card's title (`CdxInfoChip`), e.g. "High revert risk". */
export interface HomeCardChip {
  label: string
  status: 'notice' | 'warning' | 'error' | 'success'
  icon?: Icon
}

/** Everything `HomeCard` needs to render one card. Modules map their API data to this. */
export interface HomeCardData {
  /** Stable per-source id (e.g. `tfa:Dam`) — list key and, later, the saved-item id. */
  key: string
  title: string
  /** The wiki page the card is about — what saving saves. */
  pageTitle?: string
  /** Part of `title` to show bold (a Did you know hook's article). */
  titleEmphasis?: string
  description?: string
  thumbnailUrl?: string
  /** Where the card leads inside the prototype. Give this or `href`. */
  to?: RouteLocationRaw
  /** Where the card leads off the prototype (a new tab, after the leave dialog). */
  href?: string
  /** A glyph in place of a thumbnail (a stat card's). */
  icon?: Icon
  /** Short line under the text, e.g. "Article of the day". */
  supportingText?: string
  /** When, e.g. "3h ago": set apart at the far end of the supporting line (home2). */
  supportingTime?: string
  chips?: HomeCardChip[]
  /** Which of the module's filters the card belongs to (see `HomeModuleSpec.filters`). */
  filterId?: string
}
