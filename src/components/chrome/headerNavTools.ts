/**
 * Preset identifiers for chrome tool buttons (desktop end-cluster); order follows layout.
 * PROTOWIKI+ (Home) Opt-in `home` and `user-menu`; the default set is unchanged.
 * PROTOWIKI+ (Nov release) Opt-in `user-avatar-menu`: the same menu behind an avatar.
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
  | 'user-avatar-menu'

export const DEFAULT_CHROME_NAV_TOOLS: ChromeNavTool[] = [
  'appearance',
  'notifications',
  'notices',
  'bookmarks',
  'watchlist',
  'user',
]
