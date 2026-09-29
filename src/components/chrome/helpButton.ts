import { computed } from 'vue'

import { isProjectNamespaceTitle } from '@/components/article/shared/wikiNamespace'
import { stickyHeaderTitle } from './stickyHeaderSubject'

/**
 * When the chrome offers help: on the pages that are *about* the project
 * rather than about a subject — `Wikipedia:`, `User:` and `Help:` pages — where
 * a reader who wandered in from an article is most likely to need a way out.
 *
 * Derived from the page subject the article surface publishes
 * (`./stickyHeaderSubject`), so any prototype rendering an article through
 * `ArticleHeader` gets the button with no wiring: the title carries its own
 * namespace. A page that registers no subject (a dashboard, a special page) is
 * mainspace as far as this is concerned, and the button stays away.
 *
 * Module-level rather than provide/inject, for the same reason as the sticky
 * header subject: the surface that owns the title and the chrome that renders
 * the button are siblings.
 */
export const helpButtonVisible = computed(() => isProjectNamespaceTitle(stickyHeaderTitle.value))

/**
 * Label on the help affordance — `aria-label` when the button is icon-only,
 * visible text when the playground turns labels on.
 *
 * English-only, unlike the home button next to it: that one mirrors the
 * translated MediaWiki message `mobile-frontend-home-button`
 * (`@/i18n/homeButtonMessages`), and there is no imported message set behind
 * this one yet.
 */
export const HELP_BUTTON_LABEL = 'Help'
