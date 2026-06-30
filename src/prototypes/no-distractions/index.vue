<script setup lang="ts">
import { onBeforeUnmount, watch } from 'vue'

import MobileWrapper from '@/components/MobileWrapper.vue'
import { useConfig } from '@/composables/useConfig'
import { normalizeWikiUsername, type ConfigUser } from '@/config'

import { useFlowState, type Screen } from './data/useFlowState'
import { useConfigureSettings } from './data/useConfigureSettings'
import {
  resolveRecentChangesCacheKey,
  useRecentChanges,
} from './data/useRecentChanges'
import { resolveSuggestionSeedState, useSuggestions } from './data/useSuggestions'
import SearchScreen from './screens/SearchScreen.vue'
import ReadScreen from './screens/ReadScreen.vue'
import CreateAccountScreen from './screens/CreateAccountScreen.vue'
import WelcomeScreen from './screens/WelcomeScreen.vue'
import SurveyScreen from './screens/SurveyScreen.vue'
import InterestsScreen from './screens/InterestsScreen.vue'
import EmailScreen from './screens/EmailScreen.vue'
import HomeScreen from './screens/HomeScreen.vue'
import AllSuggestionsScreen from './screens/AllSuggestionsScreen.vue'
import FeaturedScreen from './screens/FeaturedScreen.vue'
import TrendingScreen from './screens/TrendingScreen.vue'
import { useFeaturedFeed } from './data/useFeaturedFeed'
import { useTrendingPages } from './data/useTrendingPages'

definePage({
  meta: {
    title: 'No distractions',
    description: 'A streamlined onboarding flow.',
  },
})

const flow = useFlowState()
const { user, realUsername, lang } = useConfig()
const configureSettings = useConfigureSettings()

// Bind once at the route shell; home/all read the shared cache without rebinding.
useSuggestions(() => {
  const base = resolveSuggestionSeedState(
    flow.interests.value,
    flow.title.value,
    flow.hasExplicitInterests.value,
  )
  const useEditingHistory = user.value === 'real' && configureSettings.value.editingHistory
  const historyKey =
    useEditingHistory && realUsername.value.trim()
      ? `history:${normalizeWikiUsername(realUsername.value).toLowerCase()}`
      : 'history:off'

  return {
    seeds: base.seeds,
    cacheKey: base.cacheKey ? `${base.cacheKey}|${historyKey}` : '',
    useEditingHistory,
    realUsername: realUsername.value,
    lang: lang.value,
  }
})

useRecentChanges(() => ({
  interests: flow.interests.value,
  isRealUser: user.value === 'real',
  realUsername: realUsername.value,
  lang: lang.value,
  cacheKey: resolveRecentChangesCacheKey(
    flow.interests.value,
    user.value === 'real',
    realUsername.value,
  ),
}))

// Bind once at the route shell; featured screen reads the shared cache.
useFeaturedFeed(true)
useTrendingPages(true)

// Logged-out chrome before the account exists; logged-in afterwards. The
// article header reads the global config user, so we drive it per screen and
// restore whatever the gallery had when leaving the prototype.
const LOGGED_OUT_SCREENS: Screen[] = ['search', 'read', 'account']
const originalUser = user.value

watch(
  flow.screen,
  (screen) => {
    if (user.value === 'real') return
    const next: ConfigUser = LOGGED_OUT_SCREENS.includes(screen) ? 'logged-out' : 'new'
    if (user.value !== next) user.value = next
  },
  { immediate: true },
)

onBeforeUnmount(() => {
  user.value = originalUser
})
</script>

<template>
  <MobileWrapper max-width="412px" :show-frame-border="false">
    <SearchScreen v-if="flow.screen.value === 'search'" :flow="flow" />
    <ReadScreen v-else-if="flow.screen.value === 'read'" :flow="flow" />
    <CreateAccountScreen v-else-if="flow.screen.value === 'account'" :flow="flow" />
    <WelcomeScreen v-else-if="flow.screen.value === 'welcome'" :flow="flow" />
    <SurveyScreen v-else-if="flow.screen.value === 'survey'" :flow="flow" />
    <InterestsScreen v-else-if="flow.screen.value === 'interests'" :flow="flow" />
    <EmailScreen v-else-if="flow.screen.value === 'email'" :flow="flow" />
    <HomeScreen v-else-if="flow.screen.value === 'home'" :flow="flow" />
    <AllSuggestionsScreen v-else-if="flow.screen.value === 'all'" :flow="flow" />
    <FeaturedScreen v-else-if="flow.screen.value === 'featured'" :flow="flow" />
    <TrendingScreen v-else-if="flow.screen.value === 'trending'" :flow="flow" />
  </MobileWrapper>
</template>
