import { computed, nextTick } from 'vue'

import {
  DEFAULT_WIKITA_LITE_VIEW,
  parseWikitaLiteView,
  viewForPath,
  WIKITA_LITE_HOME,
  type WikitaLiteView,
} from '../routes'
import { useWikitaLiteRoute } from './useWikitaLiteRoute'

export function useWikitaLiteView() {
  const { route, router, wikitaLiteRoute, replaceQuery } = useWikitaLiteRoute()

  const isHome = computed(
    () => route.path === WIKITA_LITE_HOME || route.path === `${WIKITA_LITE_HOME}/`,
  )

  const activeView = computed<WikitaLiteView>(() => {
    if (isHome.value) {
      return parseWikitaLiteView(route.query.view)
    }
    return viewForPath(route.path)
  })

  function scrollToTop() {
    window.scrollTo(0, 0)
  }

  const isHomeFeed = computed(
    () => isHome.value && activeView.value === DEFAULT_WIKITA_LITE_VIEW,
  )

  async function selectView(view: WikitaLiteView) {
    if (isHome.value && activeView.value === view) {
      scrollToTop()
      return
    }

    const destination =
      view === DEFAULT_WIKITA_LITE_VIEW
        ? wikitaLiteRoute(WIKITA_LITE_HOME, { view: null })
        : wikitaLiteRoute(WIKITA_LITE_HOME, { view })

    await router.push(destination)

    await nextTick()
    scrollToTop()
  }

  async function goHome() {
    if (isHomeFeed.value) {
      scrollToTop()
      return
    }

    await router.push(wikitaLiteRoute(WIKITA_LITE_HOME))

    await nextTick()
    scrollToTop()
  }

  return {
    activeView,
    isHome,
    isHomeFeed,
    selectView,
    goHome,
    scrollToTop,
    replaceQuery,
  }
}
