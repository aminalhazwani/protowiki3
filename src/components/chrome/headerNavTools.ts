/**
 * Preset identifiers for chrome tool buttons (desktop end-cluster); order follows layout.
 * PROTOWIKI+ (Home) Opt-in `home`, `bookmarks` and `user-menu`; the default set is unchanged.
 */
export type ChromeNavTool =
  | 'home'
  | 'appearance'
  | 'notifications'
  | 'notices'
  | 'bookmarks'
  | 'watchlist'
  | 'user'
  | 'user-menu'

export const DEFAULT_CHROME_NAV_TOOLS: ChromeNavTool[] = [
  'appearance',
  'notifications',
  'notices',
  'watchlist',
  'user',
]
