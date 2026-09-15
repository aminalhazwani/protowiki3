import { computed, ref, type ComputedRef, type Ref } from 'vue'

import { homeButtonMessage, HOME_BUTTON_MESSAGES } from '@/i18n/homeButtonMessages'

/** Language the prototype’s chrome labels are rendered in. */
export const DEFAULT_UI_LANGUAGE = 'en'

/**
 * Whether the chrome can actually be rendered in `lang` — i.e. the article
 * language menu offers it. Same set as the menu's rows, both generated from
 * the translations of `mobile-frontend-home-button`.
 */
export function isKnownUiLanguage(lang: unknown): lang is string {
  return typeof lang === 'string' && Object.hasOwn(HOME_BUTTON_MESSAGES, lang)
}

/**
 * Interface language of the chrome, swapped when someone picks an
 * interlanguage link in `ArticleHeader`. Module-level like `globalSkin` /
 * `globalTheme` in `theme.ts`: every header instance reads the same value.
 */
export const uiLanguage: Ref<string> = ref(DEFAULT_UI_LANGUAGE)

export function setUiLanguage(lang: string): void {
  uiLanguage.value = lang
}

/**
 * `lang` attribute value for {@link uiLanguage}. `simple` is a Wikipedia
 * subdomain, not a BCP 47 tag, so it reports as plain English.
 */
export const uiLanguageTag: ComputedRef<string> = computed(() =>
  uiLanguage.value === 'simple' ? 'en' : uiLanguage.value,
)

/** Translated `mobile-frontend-home-button` label for the active UI language. */
export const homeButtonLabel: ComputedRef<string> = computed(() =>
  homeButtonMessage(uiLanguage.value),
)
