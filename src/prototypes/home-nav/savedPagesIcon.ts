import type { Icon } from '@wikimedia/codex-icons'

/**
 * The tab bar's empty "saved pages" icon (Figma T419358-Home, `saved-pages`),
 * derived from Codex's filled `cdxIconBookmarkList` so the two line up exactly
 * when the Saved tab is selected:
 *
 * - Back page: Codex's path, unchanged.
 * - Front page: Codex's path with a hole 2px inside every edge (sharp joins,
 *   like an inside stroke). The notch's diagonals rise 3.5556 over 4px, so
 *   the hole's bottom corners land at y 16.8796 and its tip at y 13.3241.
 *
 * CODEX+ icons: Codex has no outline bookmark list.
 */
export const savedPagesOutlineIcon: Icon = {
  ltr:
    '<path fill-rule="evenodd" d="M14 20h-1.5L8 16l-4.5 4H2V4h12zM4 6v10.8796l4-3.5555 4 3.5555V6z"/>' +
    '<path d="M18 14h-2V2H7V0h11z"/>',
  shouldFlip: true,
}
