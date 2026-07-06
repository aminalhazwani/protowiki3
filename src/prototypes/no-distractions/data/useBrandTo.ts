import { computed, type ComputedRef } from 'vue'
import { useRoute, type RouteLocationRaw } from 'vue-router'

/**
 * Brand/logo link target for the no-distractions prototype: the prototype's
 * Main Page, preserving the current session (username, interests, …) while
 * clearing the current article (`title`) and screen. A plain `to="/..."` link
 * would drop the whole query — losing the user's logged-in state and Home.
 */
export function useBrandTo(): ComputedRef<RouteLocationRaw> {
  const route = useRoute()
  return computed<RouteLocationRaw>(() => {
    const query = { ...route.query }
    delete query.title
    delete query.screen
    return { path: '/no-distractions', query }
  })
}
