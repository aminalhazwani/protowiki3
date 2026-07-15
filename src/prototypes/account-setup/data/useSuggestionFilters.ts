import { ref, type Ref } from 'vue'

import { SUGGESTION_FILTER_OPTIONS } from './microtaskCatalog'

export interface SuggestionFiltersState {
  /** Task headings currently shown. Maps onto a CdxCheckbox group v-model. */
  enabled: Ref<string[]>
  /** Whether a suggestion with this task heading should be shown. */
  isEnabled: (heading: string) => boolean
}

const ALL_HEADINGS = SUGGESTION_FILTER_OPTIONS.map((option) => option.heading)

let shared: SuggestionFiltersState | null = null

/**
 * Shared suggested-edits filter state. Singleton (like {@link useSuggestions})
 * so the filter sheet in the sticky header and the list in AllSuggestionsScreen
 * read and write the same enabled set. All task types start enabled.
 */
export function useSuggestionFilters(): SuggestionFiltersState {
  if (!shared) {
    const enabled = ref<string[]>([...ALL_HEADINGS])
    shared = {
      enabled,
      isEnabled: (heading: string) => enabled.value.includes(heading),
    }
  }
  return shared
}
