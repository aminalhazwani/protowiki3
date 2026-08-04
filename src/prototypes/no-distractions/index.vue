<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { CdxButton } from '@wikimedia/codex'

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

// --- Personalisation wizard (welcome -> survey -> interests) ---------------
// These three steps share one persistent OnboardingShell so the header chrome
// (back/close, step counter) stays fixed while only the content region slides.
// Each screen renders its content only; the shell lives here.
const WIZARD_STEP: Partial<Record<Screen, number>> = {
  welcome: 1,
  survey: 2,
  interests: 3,
}

// Interests doubles as a reconfigure screen reached from Home (returnTo set);
// there it renders its own DialogShell, so keep it OUT of the wizard dialog and
// render it standalone (matching the other routed screens).
const isConfigureInterests = computed(
  () => flow.screen.value === 'interests' && flow.returnTo.value !== '',
)

const isWizard = computed(
  () => flow.screen.value in WIZARD_STEP && !isConfigureInterests.value,
)
const wizardStep = computed(() => WIZARD_STEP[flow.screen.value] ?? 0)

// Drives the interests footer CTA: the seed article (title param) is pre-filled
// as interest #1, so the button only turns progressive once the reader has
// picked an interest beyond it. Mirrors the computed formerly in InterestsScreen.
const goHomeActive = computed(
  () => flow.interests.value.filter((t) => t !== flow.title.value).length >= 1,
)

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

// The interests screen lets the reader pick as many articles as they like, but
// only the first N seed the suggested-edits pool — picks past that keep
// refreshing the related-articles list without reshuffling the pool (the cache
// key derives from these seeds, so no refetch either). The seed article counts.
const POOL_INTEREST_LIMIT = 10

// Bind once at the route shell; home/all read the shared cache without rebinding.
useSuggestions(() => {
  const base = resolveSuggestionSeedState(
    flow.interests.value.slice(0, POOL_INTEREST_LIMIT),
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

        <!--
          Per-step CTA lives in the dialog's fixed footer (no more sticky
          buttons). All actions are plain route moves; the interests button
          flips quiet -> progressive-primary once a second interest is added.
        -->
        <!--
          Distinct keys so Vue mounts a fresh button per step rather than
          recycling one element — otherwise the tapped button's sticky
          focus/hover state (iOS) carries over to the next step's label.
        -->
        <template #footer>
          <CdxButton
            v-if="flow.screen.value === 'welcome'"
            key="cta-welcome"
            class="ob-footer-cta"
            size="large"
            weight="primary"
            action="progressive"
            @click="flow.goTo('survey')"
          >
            Personalize your Home
          </CdxButton>
          <CdxButton
            v-else-if="flow.screen.value === 'survey'"
            key="cta-survey"
            class="ob-footer-cta"
            size="large"
            weight="quiet"
            @click="flow.goTo('interests')"
          >
            Skip
          </CdxButton>
          <CdxButton
            v-else-if="flow.screen.value === 'interests'"
            key="cta-interests"
            class="ob-footer-cta"
            size="large"
            :weight="goHomeActive ? 'primary' : 'quiet'"
            :action="goHomeActive ? 'progressive' : 'default'"
            @click="flow.goTo('home')"
          >
            Go to your Home
          </CdxButton>
        </template>
      </OnboardingShell>

      <!--
        Reconfigure entry (opened from Home): renders its own DialogShell
        (overlay=false), which stretches to fill a flex column — the role the
        wizard's OnboardingShell used to play. Provide that column here now that
        this path is rendered standalone rather than inside the wizard dialog.
      -->
      <div v-else-if="isConfigureInterests" key="interests-configure" class="nd-configure-host">
        <InterestsScreen :flow="flow" />
      </div>

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

/* The dialog footer holds a single full-width CTA (size="large" sets height). */
.ob-footer-cta {
  width: 100%;
}

/* Flex column so the standalone reconfigure DialogShell (overlay=false) fills
   the frame, matching how it stretched inside the wizard shell before. */
.nd-configure-host {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  min-height: 100dvh;
}
</style>
