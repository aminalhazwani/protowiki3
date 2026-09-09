import { computed, type ComputedRef } from 'vue'
import { useRoute, type RouteLocationRaw } from 'vue-router'

/**
 * Brand/logo link target for wikita-lite onboarding: the Main Page read screen,
 * preserving session query (username, interests, …) while clearing the article.
 */
export function useBrandTo(): ComputedRef<RouteLocationRaw> {
  const route = useRoute()
  return computed<RouteLocationRaw>(() => {
    const query = { ...route.query }
    if (query.interests === undefined && query.title) {
      query.interests = query.title
    }
    delete query.title
    delete query.screen
    return { path: '/wikita-lite', query }
  })
}
