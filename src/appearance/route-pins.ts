import { ref } from 'vue'
import type { RouteLocationNormalized, Router } from 'vue-router'

import type { ConfigUser, ConfigWebSkin } from '@/config'

/**
 * Per-prototype **pins** — `definePage({ meta: { skin, user } })`.
 *
 * A prototype that declares a pin opens with that value no matter what the
 * visitor saved in Settings, and the visitor's saved settings are never
 * touched. While on the prototype, changing that setting (Settings, `?skin=`)
 * changes only this in-memory value: it lasts until you leave the prototype
 * or reload, then the pin applies again.
 *
 * `null` = not pinned; the saved setting applies.
 */
export const pinnedWebSkin = ref<ConfigWebSkin | null>(null)
export const pinnedUser = ref<ConfigUser | null>(null)

/** First path segment — the prototype folder (`/home-nav/foo` → `home-nav`). */
function prototypeKey(route: RouteLocationNormalized): string {
  return route.path.replace(/^\/+/, '').split('/')[0] ?? ''
}

function applyRoutePins(to: RouteLocationNormalized, from: RouteLocationNormalized | null): void {
  // Moving around inside the same prototype keeps whatever the visitor switched to.
  const samePrototype = from !== null && from.matched.length > 0 && prototypeKey(from) === prototypeKey(to)

  const skin = to.meta.skin ?? null
  if (skin === null) pinnedWebSkin.value = null
  else if (!samePrototype || pinnedWebSkin.value === null) pinnedWebSkin.value = skin

  const user = to.meta.user ?? null
  if (user === null) pinnedUser.value = null
  else if (!samePrototype || pinnedUser.value === null) pinnedUser.value = user
}

/** Apply route pins before each route renders. */
export function wireRoutePins(router: Router): void {
  router.beforeEach((to, from) => {
    applyRoutePins(to, from.matched.length > 0 ? from : null)
  })
}
