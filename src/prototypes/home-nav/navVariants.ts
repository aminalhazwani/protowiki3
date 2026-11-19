import { computed } from 'vue'
import { useRoute, useRouter, type Router } from 'vue-router'

import { mergedLocationQuery } from '@/appearance/url-query'

/** This prototype's routes. */
export const HOME_NAV_PATH = '/home-nav'
export const HOME_NAV_HOME_PATH = '/home-nav/home'
export const HOME_NAV_SAVED_PATH = '/home-nav/saved'

/** The account the prototype is signed in as (user menu, Home greeting, footer). */
export const HOME_NAV_USERNAME = 'Newcomer123'

/**
 * The navigation proposals under test, in the order the ☰ drawer lists them.
 * `?nav=<id>` picks one; no `?nav=` is production.
 */
export const NAV_VARIANTS = [
  { id: 'production', label: 'Production' },
  { id: 'tab-bar', label: 'Home in tab bar' },
  { id: 'menu', label: 'Home in menu' },
  { id: 'header', label: 'Home in header' },
] as const

export type NavVariant = (typeof NAV_VARIANTS)[number]['id']

const DEFAULT_VARIANT: NavVariant = 'production'

export function isNavVariant(value: unknown): value is NavVariant {
  return NAV_VARIANTS.some((variant) => variant.id === value)
}

function isHomeNavPath(path: string): boolean {
  return path === HOME_NAV_PATH || path.startsWith(`${HOME_NAV_PATH}/`)
}

/** The variant in effect, and a setter that keeps the rest of the URL. */
export function useNavVariant() {
  const route = useRoute()
  const router = useRouter()

  const variant = computed<NavVariant>(() =>
    isNavVariant(route.query.nav) ? route.query.nav : DEFAULT_VARIANT,
  )

  function setVariant(next: NavVariant): void {
    if (next === variant.value) return
    const query = mergedLocationQuery(route.query, { nav: next })
    if (next === DEFAULT_VARIANT) delete query.nav
    void router.replace({ path: route.path, query, hash: route.hash })
  }

  return { variant, setVariant }
}

const installed = new WeakSet<Router>()

/**
 * Keep `?nav=` while moving around the prototype: links that build their own
 * query (Home, the user menu, search) would otherwise drop it and fall back
 * to production.
 */
export function keepNavParam(router: Router): void {
  if (installed.has(router)) return
  installed.add(router)

  router.beforeEach((to, from) => {
    if (!isHomeNavPath(to.path) || !isHomeNavPath(from.path)) return true
    if (to.query.nav !== undefined || !isNavVariant(from.query.nav)) return true
    return { path: to.path, query: { ...to.query, nav: from.query.nav }, hash: to.hash }
  })
}

/** Is `href` (as an `<a>` resolves it) a page of this prototype? */
export function isHomeNavHref(href: string, base = import.meta.env.BASE_URL): boolean {
  let url: URL
  try {
    url = new URL(href, window.location.href)
  } catch {
    return false
  }
  if (url.origin !== window.location.origin) return false
  const prefix = base.endsWith('/') ? base.slice(0, -1) : base
  const path = prefix && url.pathname.startsWith(prefix) ? url.pathname.slice(prefix.length) : url.pathname
  return isHomeNavPath(path)
}
