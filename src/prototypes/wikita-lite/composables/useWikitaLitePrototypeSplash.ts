import { computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'

import { WIKITA_LITE_HOME } from '../routes'
import { useWikitaLiteUrlState } from './useWikitaLiteUrlState'

/**
 * Prototype splash at ?screen=splash. Dismissal navigates to onboarding
 * (screen=article) or Home (screen cleared) depending on onboarded state.
 */
export function useWikitaLitePrototypeSplash() {
  const route = useRoute()
  const { state, isOnboarded, patchState } = useWikitaLiteUrlState()

  const showSplash = computed(() => state.value.screen === 'splash')

  onMounted(() => {
    const path = route.path
    if (path !== WIKITA_LITE_HOME && path !== `${WIKITA_LITE_HOME}/`) return
    const raw = route.query.screen
    const inUrl = Array.isArray(raw) ? raw[0] : raw
    if (state.value.screen === 'splash' && inUrl !== 'splash') {
      void patchState({ screen: 'splash' })
    }
  })

  function dismissSplash(): void {
    if (isOnboarded.value) {
      void patchState({ screen: null })
    } else {
      void patchState({ screen: 'article' })
    }
  }

  return { showSplash, dismissSplash }
}
