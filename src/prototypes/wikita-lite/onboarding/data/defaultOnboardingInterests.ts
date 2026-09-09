import { normalizeInterestTitles } from '../../../musical-group/data/interests'

export const MAIN_PAGE_TITLE = 'Main Page'

export function isOnboardingSeedTitle(title: string): boolean {
  const trimmed = title.trim()
  return trimmed.length > 0 && trimmed !== MAIN_PAGE_TITLE
}

export function defaultOnboardingInterests(input: {
  searchedTitle?: string
  saveTitle?: string
  title?: string
}): string[] {
  const fromActions = [input.searchedTitle, input.saveTitle].filter((title): title is string =>
    isOnboardingSeedTitle(title ?? ''),
  )
  if (fromActions.length) return normalizeInterestTitles(fromActions)
  if (isOnboardingSeedTitle(input.title ?? '')) {
    return normalizeInterestTitles([input.title!])
  }
  return []
}
