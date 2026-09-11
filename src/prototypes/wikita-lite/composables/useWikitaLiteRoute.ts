import { useRoute, useRouter, type RouteLocationRaw } from 'vue-router'

import {
  mergeWikitaLiteQuery,
  parseWikitaLiteQuery,
  type WikitaLiteUrlStatePatch,
} from '../data/urlStateSchema'

export function useWikitaLiteRoute() {
  const route = useRoute()
  const router = useRouter()

  function wikitaLiteRoute(path: string, patch?: WikitaLiteUrlStatePatch): RouteLocationRaw {
    const query = patch ? mergeWikitaLiteQuery(route.query, patch) : { ...route.query }
    return { path, query }
  }

  function patchQuery(patch: WikitaLiteUrlStatePatch): RouteLocationRaw {
    return {
      path: route.path,
      query: mergeWikitaLiteQuery(route.query, patch),
    }
  }

  async function replaceQuery(patch: WikitaLiteUrlStatePatch): Promise<void> {
    await router.replace(patchQuery(patch))
  }

  async function pushRoute(path: string, patch?: WikitaLiteUrlStatePatch): Promise<void> {
    await router.push(wikitaLiteRoute(path, patch))
  }

  async function replaceRoute(path: string, patch?: WikitaLiteUrlStatePatch): Promise<void> {
    await router.replace(wikitaLiteRoute(path, patch))
  }

  return {
    route,
    router,
    wikitaLiteRoute,
    patchQuery,
    replaceQuery,
    pushRoute,
    replaceRoute,
  }
}
