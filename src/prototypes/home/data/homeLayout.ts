/**
 * Which modules the Home shows, and in what order. The registry (`modules.ts`)
 * is the catalogue; a layout is an order over all of it plus the ids switched on.
 */
import type { HomeModuleId } from '../modules'

export interface HomeLayout {
  /** Every module, in the order the Home and the "Home layout" list show them. */
  order: HomeModuleId[]
  /** The modules switched on. */
  on: HomeModuleId[]
}

/**
 * home2's default (its "read and edit" survey answer): four modules on, the
 * rest listed after them, off. Onboarding's survey (F5) will pick between
 * per-answer defaults.
 */
export const DEFAULT_HOME_LAYOUT: HomeLayout = {
  order: [
    'suggested-edits',
    'daily-reads',
    'impact',
    'mentor',
    'saved',
    'featured',
    'did-you-know',
    'trending',
    'review-changes',
    'active-discussions',
  ],
  on: ['suggested-edits', 'daily-reads', 'impact', 'mentor'],
}

/**
 * Fit a stored layout (or the default, for `null`) to the registry's `ids`:
 * unknown and repeated ids are dropped, and modules it doesn't list (added
 * since it was saved) go at the end, switched off.
 */
export function resolveHomeLayout(
  stored: { order: readonly string[]; on: readonly string[] } | null,
  ids: readonly HomeModuleId[],
): HomeLayout {
  const source = stored ?? DEFAULT_HOME_LAYOUT
  const known = (id: string): id is HomeModuleId => (ids as readonly string[]).includes(id)
  const order = [...new Set(source.order.filter(known))]
  for (const id of ids) if (!order.includes(id)) order.push(id)
  const on = order.filter((id) => source.on.includes(id))
  return { order, on }
}
