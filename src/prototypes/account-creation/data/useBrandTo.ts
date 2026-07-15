import { computed, type ComputedRef } from 'vue'
import { useRoute, type RouteLocationRaw } from 'vue-router'

/**
 * Brand/logo link target for the account-creation prototype: the prototype's
 * Main Page, preserving the current session (username, interests, …) while
 * clearing the current article (`title`) and screen. A plain `to="/..."` link
 * would drop the whole query — losing the user's logged-in state and Home.
 */
export function useBrandTo(): ComputedRef<RouteLocationRaw> {
  const route = useRoute()
  return computed<RouteLocationRaw>(() => {
    const query = { ...route.query }
    // The main page clears the current article (title). When Home's suggestions
    // were seeded from that title (no explicit interests yet), promote it to an
    // explicit interest so returning Home keeps its suggestions — mirroring the
    // "interests default to [title]" rule in useFlowState.
    if (query.interests === undefined && query.title) {
      query.interests = query.title
    }
    delete query.title
    delete query.screen
    return { path: '/account-creation', query }
  })
}
