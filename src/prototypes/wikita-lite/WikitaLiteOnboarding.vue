<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { CdxButton } from '@wikimedia/codex'

import { useConfig } from '@/composables/useConfig'
import type { ConfigUser } from '@/config'

import OnboardingShell from './onboarding/components/OnboardingShell.vue'
import './onboarding/components/onboarding-motion.css'
import { completeWikitaLiteOnboarding } from './onboarding/data/onboardingPersistence'
import {
  useWikitaLiteOnboardingFlow,
  type OnboardingScreen,
} from './onboarding/data/useWikitaLiteOnboardingFlow'
import SearchScreen from './onboarding/screens/SearchScreen.vue'
import ReadScreen from './onboarding/screens/ReadScreen.vue'
import CreateAccountScreen from './onboarding/screens/CreateAccountScreen.vue'
import WelcomeScreen from './onboarding/screens/WelcomeScreen.vue'
import SurveyScreen from './onboarding/screens/SurveyScreen.vue'
import InterestsScreen from './onboarding/screens/InterestsScreen.vue'

const emit = defineEmits<{ completed: [] }>()

const flow = useWikitaLiteOnboardingFlow()
const { user } = useConfig()

const WIZARD_STEP: Partial<Record<OnboardingScreen, number>> = {
  welcome: 1,
  survey: 2,
  interests: 3,
}

const isWizard = computed(() => flow.screen.value in WIZARD_STEP)
const wizardStep = computed(() => WIZARD_STEP[flow.screen.value] ?? 0)

const autoSeedKeys = ref(new Set<string>())

watch(
  () => flow.screen.value,
  (screen, prev) => {
    if (screen === 'interests' && prev !== 'interests') {
      autoSeedKeys.value = new Set(flow.interests.value.map((title) => title.toLowerCase()))
    }
  },
  { immediate: true },
)

const goHomeActive = computed(() =>
  flow.interests.value.some((title) => !autoSeedKeys.value.has(title.toLowerCase())),
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

const LOGGED_OUT_SCREENS: OnboardingScreen[] = ['search', 'article', 'account']
const originalUser = user.value
let completedOnboarding = false

function finishOnboarding(): void {
  completeWikitaLiteOnboarding(flow)
  completedOnboarding = true
  emit('completed')
}

async function dismissWizard(): Promise<void> {
  await flow.goTo('home')
}

watch(
  () => flow.screen.value,
  (screen) => {
    if (screen === 'home') {
      finishOnboarding()
    }
  },
  { immediate: true },
)

watch(
  [flow.screen, flow.username, flow.title],
  ([screen, username]) => {
    if (user.value === 'real') return
    const hasHome = username.trim().length > 0
    const loggedOut = LOGGED_OUT_SCREENS.includes(screen) && !(screen === 'article' && hasHome)
    const next: ConfigUser = loggedOut ? 'logged-out' : 'new'
    if (user.value !== next) user.value = next
  },
  { immediate: true },
)

onBeforeUnmount(() => {
  if (!completedOnboarding) {
    user.value = originalUser
  }
})
</script>

<template>
  <Transition name="ob-fade" mode="out-in">
    <OnboardingShell
      v-if="isWizard"
      key="wizard"
      :current="wizardStep"
      @dismiss="dismissWizard"
    >
      <div class="ob-step-viewport">
        <Transition :name="stepTransition">
          <component :is="wizardComponent" :key="flow.screen.value" :flow="flow" />
        </Transition>
      </div>

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
          @click="flow.goTo('interests', { survey: 'both' })"
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

    <SearchScreen v-else-if="flow.screen.value === 'search'" key="search" :flow="flow" />
    <ReadScreen v-else-if="flow.screen.value === 'article'" key="article" :flow="flow" />
    <CreateAccountScreen v-else-if="flow.screen.value === 'account'" key="account" :flow="flow" />
  </Transition>
</template>

<style scoped>
.ob-step-viewport {
  position: relative;
  display: flex;
  flex-direction: column;
  flex: 1 1 auto;
  min-height: 0;
  overflow-x: clip;
}

.ob-footer-cta {
  width: 100%;
}
</style>
