import type { RouteLocationRaw } from 'vue-router'

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
  /** Where the card leads inside the prototype. */
  to: RouteLocationRaw
  /** Short line under the text, e.g. "Article of the day". */
  supportingText?: string
}
