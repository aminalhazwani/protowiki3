<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { CdxDialog } from '@wikimedia/codex'

import MobileWrapper from '@/components/MobileWrapper.vue'
import { useConfig } from '@/composables/useConfig'
import { normalizeWikiUsername, type ConfigUser } from '@/config'

import OnboardingShell from './components/OnboardingShell.vue'
import './components/onboarding-motion.css'
import { useFlowState, type Screen } from './data/useFlowState'
import { useConfigureSettings } from './data/useConfigureSettings'
import { resolveRecentChangesCacheKey, useRecentChanges } from './data/useRecentChanges'
import { resolveSuggestionSeedState, useSuggestions } from './data/useSuggestions'
import SearchScreen from './screens/SearchScreen.vue'
import ReadScreen from './screens/ReadScreen.vue'
import CreateAccountScreen from './screens/CreateAccountScreen.vue'
import WelcomeScreen from './screens/WelcomeScreen.vue'
import SurveyScreen from './screens/SurveyScreen.vue'
import InterestsScreen from './screens/InterestsScreen.vue'
import HomeScreen from './screens/HomeScreen.vue'
import SuggestedEditsCarouselScreen from './screens/SuggestedEditsCarouselScreen.vue'
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

// Intro dialog shown on every open, orienting Wikimania participants before
// they start the flow. Purely informational — the single "Got it" action just
// dismisses it.
const showIntro = ref(true)
const introAction = {
  label: 'Got it',
  actionType: 'progressive' as const,
}

// --- Personalisation wizard (welcome -> survey -> interests) ---------------
// These three steps share one persistent OnboardingShell so the header chrome
// (back/close, step counter) stays fixed while only the content region slides.
// Each screen renders its content only; the shell lives here.
const WIZARD_STEP: Partial<Record<Screen, number>> = {
  welcome: 1,
  survey: 2,
  interests: 3,
}

const isWizard = computed(() => flow.screen.value in WIZARD_STEP)
const wizardStep = computed(() => WIZARD_STEP[flow.screen.value] ?? 0)

const wizardComponent = computed(() => {
  switch (flow.screen.value) {
    case 'welcome':
      return WelcomeScreen
    case 'survey':
      return SurveyScreen
    case 'interests':
      return InterestsScreen
    default:
      return null
  }
})

// Interests doubles as a reconfigure screen reached from Home (returnTo set);
// there the wizard counter is meaningless, so hide it — matching the previous
// per-screen `:show-progress="!configureMode"`.
const showWizardProgress = computed(
  () => !(flow.screen.value === 'interests' && flow.returnTo.value !== ''),
)

// Direction for the step slide. Comparing step order (rather than tracking the
// nav intent) makes the in-app Back button and the browser Back gesture both
// resolve to a backward slide.
const stepDir = ref<'forward' | 'back'>('forward')
watch(
  () => flow.screen.value,
  (to, from) => {
    const toStep = WIZARD_STEP[to]
    const fromStep = from ? WIZARD_STEP[from] : undefined
    if (toStep && fromStep) stepDir.value = toStep >= fromStep ? 'forward' : 'back'
  },
)
const stepTransition = computed(() =>
  stepDir.value === 'forward' ? 'ob-step-forward' : 'ob-step-back',
)

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
  [flow.screen, flow.username],
  ([screen, username]) => {
    if (user.value === 'real') return
    // Once a home exists (onboarding captured a username), the article page is
    // shown logged-in — matching the account menu the return-home banner points
    // to. Pre-account, `read` stays logged-out like `search`/`account`.
    const hasHome = username.trim().length > 0
    const loggedOut = LOGGED_OUT_SCREENS.includes(screen) && !(screen === 'read' && hasHome)
    const next: ConfigUser = loggedOut ? 'logged-out' : 'new'
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
    <CdxDialog
      v-model:open="showIntro"
      title="Account setup prototype"
      close-button-label="Close"
      :dismissable="true"
      :primary-action="introAction"
      @primary="showIntro = false"
    >
      <p class="nd-intro__lead">
        This is a prototype for testing at Wikimania. Nothing you enter is saved or stored.
      </p>
      <p>To try it out:</p>
      <ol class="nd-intro__steps">
        <li>Search for an article that interests you.</li>
        <li>From there, try to create an account.</li>
        <li>Explore the account setup experience.</li>
      </ol>
      <p>Thanks for helping us test!</p>
    </CdxDialog>

    <!--
      Outer region fade (T1): sequential fade-out -> hold -> fade-in between
      screens with unrelated layouts (e.g. Create Account -> Welcome). The whole
      wizard shares one key, so this does NOT fire between wizard steps.
    -->
    <Transition name="ob-fade" mode="out-in">
      <OnboardingShell
        v-if="isWizard"
        key="wizard"
        :current="wizardStep"
        :show-progress="showWizardProgress"
        flush-content
        @dismiss="flow.goTo('home')"
      >
        <!--
          Inner step slide (T2): header chrome above stays fixed; only this
          content region slides. Direction-aware (forward/back).
        -->
        <div class="ob-step-viewport">
          <Transition :name="stepTransition">
            <component :is="wizardComponent" :key="flow.screen.value" :flow="flow" />
          </Transition>
        </div>
      </OnboardingShell>

      <SearchScreen v-else-if="flow.screen.value === 'search'" key="search" :flow="flow" />
      <ReadScreen v-else-if="flow.screen.value === 'read'" key="read" :flow="flow" />
      <CreateAccountScreen v-else-if="flow.screen.value === 'account'" key="account" :flow="flow" />
      <HomeScreen v-else-if="flow.screen.value === 'home'" key="home" :flow="flow" />
      <SuggestedEditsCarouselScreen
        v-else-if="flow.screen.value === 'all'"
        key="all"
        :flow="flow"
      />
      <FeaturedScreen v-else-if="flow.screen.value === 'featured'" key="featured" :flow="flow" />
      <TrendingScreen v-else-if="flow.screen.value === 'trending'" key="trending" :flow="flow" />
    </Transition>
  </MobileWrapper>
</template>

<style scoped>
/* Positioning context + horizontal clip for the wizard step slide. `clip`
   (not `hidden`) contains the 24px nudge without turning this into a vertical
   scroll container, so tall steps (Interests) still scroll at the page level. */
.ob-step-viewport {
  position: relative;
  display: flex;
  flex-direction: column;
  flex: 1 1 auto;
  min-height: 0;
  overflow-x: clip;
}

.nd-intro__lead {
  margin-top: 0;
}

.nd-intro__steps {
  margin: var(--spacing-50, 8px) 0;
  padding-inline-start: var(--spacing-150, 24px);
}

.nd-intro__steps li {
  margin-bottom: var(--spacing-25, 4px);
}
</style>
