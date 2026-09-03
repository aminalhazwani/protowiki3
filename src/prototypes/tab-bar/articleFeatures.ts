import type { MenuItemData } from '@wikimedia/codex'
import {
  cdxIconEdit,
  cdxIconHistory,
  cdxIconLanguage,
  cdxIconListBullet,
  cdxIconShare,
  cdxIconSpeechBubbles,
  cdxIconStar,
  cdxIconVerticalEllipsis,
} from '@wikimedia/codex-icons'

import type { ToolbarItem } from './toolbarItems'

/** Fixed feature set for the article toolbar; each feature has its own fixed icon. */
export type ArticleFeatureId =
  | 'languages'
  | 'edit'
  | 'talk'
  | 'watch'
  | 'share'
  | 'history'
  | 'contents'
  | 'more'

export const ARTICLE_FEATURE_IDS: ArticleFeatureId[] = [
  'languages',
  'edit',
  'talk',
  'watch',
  'share',
  'history',
  'contents',
  'more',
]

/** Toolbar rendering for each feature (counts/badges are static demo data). */
export const ARTICLE_FEATURES: Record<ArticleFeatureId, ToolbarItem> = {
  languages: { id: 'languages', icon: cdxIconLanguage, label: 'Languages, 38', text: '38' },
  edit: { id: 'edit', icon: cdxIconEdit, label: 'Edit, 5 suggestions', badge: '5' },
  talk: { id: 'talk', icon: cdxIconSpeechBubbles, label: 'Talk, 12 topics', text: '12' },
  watch: { id: 'watch', icon: cdxIconStar, label: 'Watch' },
  share: { id: 'share', icon: cdxIconShare, label: 'Share' },
  history: { id: 'history', icon: cdxIconHistory, label: 'History' },
  contents: { id: 'contents', icon: cdxIconListBullet, label: 'Contents' },
  more: { id: 'more', icon: cdxIconVerticalEllipsis, label: 'More' },
}

export const ARTICLE_FEATURE_LABELS: Record<ArticleFeatureId, string> = {
  languages: 'Languages',
  edit: 'Edit',
  talk: 'Talk',
  watch: 'Watch',
  share: 'Share',
  history: 'History',
  contents: 'Contents',
  more: 'More',
}

/** Menu items for the article-row select (icon + short label). */
export const ARTICLE_FEATURE_MENU_ITEMS: MenuItemData[] = ARTICLE_FEATURE_IDS.map((id) => ({
  value: id,
  label: ARTICLE_FEATURE_LABELS[id],
  icon: ARTICLE_FEATURES[id].icon,
  description: id === 'more' ? 'Everything not shown in the other tabs' : undefined,
}))
