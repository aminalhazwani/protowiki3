/**
 * The modules' "…" menus (`HomeModuleMenu`), shared by the Home and the modules'
 * own pages. Interests and Types of edits open their dialogs; the other picks
 * don't lead anywhere yet. Mentor's menu changes with its state, so it lives
 * with the module (`index.vue`).
 */
import { cdxIconConfigure, cdxIconLevelOne } from '@wikimedia/codex-icons'

export const SUGGESTED_EDITS_MENU = {
  items: [
    { value: 'interests', label: 'Interests', icon: cdxIconConfigure },
    { value: 'edit-types', label: 'Types of edits', icon: cdxIconLevelOne },
  ],
  footer: { value: 'about', label: 'About suggested edits' },
}

export const REVIEW_CHANGES_MENU = {
  items: [{ value: 'personalization', label: 'Personalization', icon: cdxIconConfigure }],
  footer: { value: 'about', label: 'About review changes' },
}
