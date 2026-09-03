import type { MenuItemData } from '@wikimedia/codex'
import { cdxIconHome } from '@wikimedia/codex-icons'
import type { Icon } from '@wikimedia/codex-icons'
import type { RouteLocationRaw } from 'vue-router'

import { ARTICLE_FEATURE_IDS, ARTICLE_FEATURE_LABELS, ARTICLE_FEATURES } from './articleFeatures'
import { resolveCodexIcon } from './codexIconCatalog'
import { labelFromDestination } from './searchDestinations'
import type { ArticleSlot, GlobalSlot } from './toolbarStore'

/**
 * One button in the mobile toolbar.
 *
 * The Customize Toolbars dialog edits **`toolbarStore`** slots; these builders
 * turn slots into the items **`MobileToolbar`** renders.
 */
export interface ToolbarItem {
  /** Stable key (also used to derive the Home dot). */
  id: string
  icon: Icon
  /** Accessible name; fold counts in (“Edit, 5 suggestions”). */
  label: string
  /** Only Home navigates in this iteration. */
  to?: RouteLocationRaw
  /** Inline count rendered next to the icon (“38”). */
  text?: string
  /** Numbered progressive badge on the icon (“5”). */
  badge?: string
  /** Current destination — progressive icon + 2px top indicator. */
  selected?: boolean
  /** Always first and not removable (Home). */
  fixed?: boolean
  /** When set, the item opens a Codex menu with these entries instead of acting as a button. */
  menuItems?: MenuItemData[]
  disabled?: boolean
}

export const HOME_PATH = '/tab-bar/home'

export const HOME_ITEM: ToolbarItem = {
  id: 'home',
  icon: cdxIconHome,
  label: 'Home',
  to: HOME_PATH,
  fixed: true,
}

/** Global toolbar: Home first, then every non-empty slot. */
export function buildGlobalItems(slots: GlobalSlot[], homeSelected: boolean): ToolbarItem[] {
  const items: ToolbarItem[] = [{ ...HOME_ITEM, selected: homeSelected }]
  for (const slot of slots) {
    if (!slot.icon || !slot.destination) continue
    const icon = resolveCodexIcon(slot.icon)
    if (!icon) continue
    items.push({ id: slot.id, icon, label: labelFromDestination(slot.destination) })
  }
  return items
}

/**
 * Article toolbar: Home first, then the fixed item for every chosen feature.
 * “More” opens a menu listing every feature not shown in the other tabs.
 */
export function buildArticleItems(slots: ArticleSlot[]): ToolbarItem[] {
  const chosen = new Set(slots.map((slot) => slot.feature))
  const leftover: MenuItemData[] = ARTICLE_FEATURE_IDS.filter(
    (id) => id !== 'more' && !chosen.has(id),
  ).map((id) => ({
    value: id,
    label: ARTICLE_FEATURE_LABELS[id],
    icon: ARTICLE_FEATURES[id].icon,
  }))

  const items: ToolbarItem[] = [HOME_ITEM]
  for (const slot of slots) {
    if (!slot.feature) continue
    const feature = ARTICLE_FEATURES[slot.feature]
    items.push(
      slot.feature === 'more'
        ? { ...feature, menuItems: leftover, disabled: leftover.length === 0 }
        : feature,
    )
  }
  return items
}
