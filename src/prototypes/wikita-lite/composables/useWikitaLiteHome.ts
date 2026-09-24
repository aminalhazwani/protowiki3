import { useConfig } from '@/composables/useConfig'

import {
  useMusicalGroupHome,
  type HomeFeedId,
  type PersonalizedFeedId,
} from '../../musical-group/useMusicalGroupHome'
import { useWikitaLiteSuggestionPreferencesSingleton } from './useWikitaLiteSuggestionPreferences'

/*
 * Home shows four at a time but "Show more" reveals the next four in place, so
 * both feeds load three pages' worth up front. Each streams its results, so the
 * first four still land as quickly as they did when four was all we asked for.
 */
export const WIKITA_LITE_HELP_WANTED_HOME_LIMIT = 12
export const WIKITA_LITE_RECENT_CHANGES_HOME_LIMIT = 12
export const WIKITA_LITE_TRANSLATION_HOME_COUNT = 2
/** Suggested edits visible before "Show more"; the rest load at low priority. */
export const WIKITA_LITE_HELP_WANTED_FOREGROUND_COUNT = 4

export type { HomeFeedId, PersonalizedFeedId }

export function useWikitaLiteHome(options?: {
  helpWantedLimit?: number
  recentChangesLimit?: number
  translationCountPerLanguage?: number
  translationLanguages?: () => string[]
  getBookmarkChangeSkipFeeds?: () => PersonalizedFeedId[]
  /** Feeds on screen; the others load behind them (see `useMusicalGroupHome`). */
  isFeedVisible?: (feed: HomeFeedId) => boolean
}) {
  const { knownLanguages } = useConfig()
  const { listInterests } = useWikitaLiteSuggestionPreferencesSingleton()

  return useMusicalGroupHome({
    helpWantedLimit: options?.helpWantedLimit ?? WIKITA_LITE_HELP_WANTED_HOME_LIMIT,
    recentChangesLimit: options?.recentChangesLimit ?? WIKITA_LITE_RECENT_CHANGES_HOME_LIMIT,
    translationCountPerLanguage:
      options?.translationCountPerLanguage ?? WIKITA_LITE_TRANSLATION_HOME_COUNT,
    translationLanguages:
      options?.translationLanguages ??
      (() => {
        const langs = knownLanguages.value
        return langs.length ? [langs[0]] : []
      }),
    getBookmarkChangeSkipFeeds: options?.getBookmarkChangeSkipFeeds,
    isFeedVisible: options?.isFeedVisible,
    helpWantedForegroundCount: WIKITA_LITE_HELP_WANTED_FOREGROUND_COUNT,
    savedPagesSource: 'readingList',
    listInterests,
  })
}
