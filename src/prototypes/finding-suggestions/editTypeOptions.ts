/** The "Select types of edits" dialog's options, by difficulty (the mockup's). */

export type EditTypeId = 'links' | 'tone' | 'references' | 'update' | 'expand'

export type EditTypeDifficulty = 'easy' | 'medium' | 'hard'

export interface EditTypeOption {
  id: EditTypeId
  label: string
  /** Under the label, as the checkbox's description. */
  description?: string
  difficulty: EditTypeDifficulty
}

export const EDIT_TYPE_OPTIONS: readonly EditTypeOption[] = [
  {
    id: 'links',
    label: 'Add links between articles',
    description: 'Machine suggestions',
    difficulty: 'easy',
  },
  { id: 'tone', label: 'Revise tone', description: 'Machine suggestions', difficulty: 'easy' },
  {
    id: 'references',
    label: 'Find references (sources for existing articles)',
    difficulty: 'medium',
  },
  {
    id: 'update',
    label: 'Update articles (bring existing articles up-to-date)',
    difficulty: 'medium',
  },
  { id: 'expand', label: 'Expand short articles', difficulty: 'hard' },
]

export const DIFFICULTY_LABELS: Record<EditTypeDifficulty, string> = {
  easy: 'Easy',
  medium: 'Medium',
  hard: 'Hard',
}

/** A new account's picks: the easy types. */
export const DEFAULT_EDIT_TYPES: readonly EditTypeId[] = ['links', 'tone']

/** Picking any of these finds suggestions (the scripted rule). */
export const HARDER_EDIT_TYPES: ReadonlySet<EditTypeId> = new Set(
  EDIT_TYPE_OPTIONS.filter((option) => option.difficulty !== 'easy').map((option) => option.id),
)
