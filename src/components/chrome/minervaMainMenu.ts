import type { RouteLocationRaw } from 'vue-router'
import type { Icon } from '@wikimedia/codex-icons'

/** One row of Minerva's main menu (`MinervaChromeMainMenu`). */
export interface MinervaMainMenuRow {
  id: string
  label: string
  icon?: Icon
  /** In-prototype destination. */
  to?: RouteLocationRaw
  /** An action rather than a page. Neither `to` nor `action`: inert. */
  action?: () => void | Promise<void>
}
