/**
 * Which modules the Home shows, and in what order. The registry (`modules.ts`)
 * is the catalogue; a layout is an order over all of it plus the ids switched on.
 */
import type { HomeModuleId } from '../modules'
import type { SurveyAnswer } from './onboarding'

export interface HomeLayout {
  /** Every module, in the order the Home and the "Home layout" list show them. */
  order: HomeModuleId[]
  /** The modules switched on. */
  on: HomeModuleId[]
}

/** The modules every survey answer switches on, in that answer's order (home2's `MODE_MODULE_ORDER`). */
const SURVEY_ORDER: Record<SurveyAnswer, HomeModuleId[]> = {
  both: ['suggested-edits', 'daily-reads', 'impact', 'mentor'],
  read: ['daily-reads', 'suggested-edits', 'impact', 'mentor'],
  edit: ['suggested-edits', 'impact', 'mentor', 'daily-reads'],
}

/** Listed after them, switched off (home2). */
const DEFAULT_OFF: HomeModuleId[] = [
  'saved',
  'featured',
  'did-you-know',
  'trending',
  'review-changes',
  'active-discussions',
]

/** The layout before the reader changes it, from their survey answer (unanswered = `both`). */
export function defaultHomeLayout(survey: SurveyAnswer | null): HomeLayout {
  const on = SURVEY_ORDER[survey ?? 'both']
  return { order: [...on, ...DEFAULT_OFF], on: [...on] }
}

/**
 * Fit a stored layout (or the survey's default, for `null`) to the registry's
 * `ids`: unknown and repeated ids are dropped, and modules it doesn't list
 * (added since it was saved) go at the end, switched off.
 */
export function resolveHomeLayout(
  stored: { order: readonly string[]; on: readonly string[] } | null,
  ids: readonly HomeModuleId[],
  survey: SurveyAnswer | null = null,
): HomeLayout {
  const source = stored ?? defaultHomeLayout(survey)
  const known = (id: string): id is HomeModuleId => (ids as readonly string[]).includes(id)
  const order = [...new Set(source.order.filter(known))]
  for (const id of ids) if (!order.includes(id)) order.push(id)
  const on = order.filter((id) => source.on.includes(id))
  return { order, on }
}
