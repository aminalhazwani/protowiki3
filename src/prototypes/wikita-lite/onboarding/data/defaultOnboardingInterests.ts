import { normalizeInterestTitles } from '../../../musical-group/data/interests'

export const MAIN_PAGE_TITLE = 'Main Page'

export function isOnboardingSeedTitle(title: string): boolean {
  const trimmed = title.trim()
  return trimmed.length > 0 && trimmed !== MAIN_PAGE_TITLE
}

/** Prefill list from transient onboarding seeds (save attempts + account-from-article). */
export function defaultOnboardingInterests(seeds: string[]): string[] {
  return normalizeInterestTitles(seeds.filter((title) => isOnboardingSeedTitle(title)))
}
