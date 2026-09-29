import { computed, ref, watch, type ComputedRef, type Ref } from 'vue'
import type { MenuButtonItemData, MenuItemValue } from '@wikimedia/codex'

import { DEFAULT_ARTICLE_LANGUAGE_LINKS, type ArticleLanguageLink } from './articleLanguageLinks'
import { homeButtonMessage } from '@/i18n/homeButtonMessages'
import { setUiLanguage } from '@/uiLanguage'

/** How many rows the menu lists — the default behind “N languages”. */
export const ARTICLE_LANGUAGE_COUNT = DEFAULT_ARTICLE_LANGUAGE_LINKS.length

/** `simple` is a Wikipedia subdomain, not a BCP 47 tag. */
function languageTag(code: string): string {
  return code === 'simple' ? 'en' : code
}

/** “18 languages” / “1 language”. */
export function languagesButtonLabel(count?: number): string {
  const n = count ?? ARTICLE_LANGUAGE_COUNT
  return n === 1 ? '1 language' : `${n} languages`
}

export interface ArticleLanguageMenu {
  menuItems: ComputedRef<MenuButtonItemData[]>
  /** Bind with `v-model:selected`; self-clears so no row keeps a checkmark. */
  selection: Ref<MenuItemValue | null>
}

/**
 * The interlanguage menu shared by `ArticleHeader` and the desktop sticky
 * header, so the two stay in step: one row list, one set of labels, and one
 * place where picking a language swaps the chrome's UI language.
 *
 * Each row is described by its own translation of `mobile-frontend-home-button`
 * (see `@/i18n/homeButtonMessages`), previewing the chrome label that picking
 * the row swaps in. Both strings carry a `lang` so shaping and fonts follow the
 * row's language rather than the page's.
 *
 * No `url` on purpose: a Codex item with one renders as an anchor, and picking
 * a language would leave the prototype for that wiki instead of swapping the
 * chrome label. The row's `href` still reaches consumers via `onSelect`.
 */
export function useArticleLanguageMenu(
  onSelect?: (link: ArticleLanguageLink) => void,
): ArticleLanguageMenu {
  const menuItems = computed((): MenuButtonItemData[] =>
    DEFAULT_ARTICLE_LANGUAGE_LINKS.map((row) => {
      const tag = languageTag(row.code)
      return {
        value: row.code,
        label: row.label,
        description: homeButtonMessage(row.code),
        language: { label: tag, description: tag },
      }
    }),
  )

  const selection = ref<MenuItemValue | null>(null)

  watch(selection, (value) => {
    if (value === null) return
    const row = DEFAULT_ARTICLE_LANGUAGE_LINKS.find((link) => link.code === value)
    if (row) {
      setUiLanguage(row.code)
      onSelect?.(row)
    }
    selection.value = null
  })

  return { menuItems, selection }
}
