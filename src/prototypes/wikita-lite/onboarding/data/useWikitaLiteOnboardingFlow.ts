import { computed, type ComputedRef, type WritableComputedRef } from 'vue'
import { useRoute, useRouter, type LocationQuery, type LocationQueryRaw } from 'vue-router'

/**
 * URL-query state for the wikita-lite onboarding flow.
 *
 * The route's query string is the single source of truth: every screen reads
 * from and writes to it, so each step is deep-linkable, shareable, and gets
 * browser back/forward for free.
 */

export const ONBOARDING_SCREENS = [
  'search',
  'read',
  'account',
  'welcome',
  'survey',
  'interests',
  'home',
] as const

export type OnboardingScreen = (typeof ONBOARDING_SCREENS)[number]

export type SurveyChoice = 'read' | 'edit' | 'both'

const SURVEY_CHOICES: SurveyChoice[] = ['read', 'edit', 'both']

const DEFAULT_SCREEN: OnboardingScreen = 'read'

function firstString(value: LocationQuery[string]): string {
  if (Array.isArray(value)) return value[0] ?? ''
  return typeof value === 'string' ? value : ''
}

function isScreen(value: string): value is OnboardingScreen {
  return (ONBOARDING_SCREENS as readonly string[]).includes(value)
}

export interface OnboardingFlowPatch {
  title?: string
  username?: string
  survey?: SurveyChoice | ''
  interests?: string[]
  email?: string
  returnTo?: OnboardingScreen | ''
}

export interface OnboardingFlowState {
  screen: ComputedRef<OnboardingScreen>
  title: ComputedRef<string>
  username: ComputedRef<string>
  survey: WritableComputedRef<SurveyChoice | ''>
  interests: WritableComputedRef<string[]>
  hasExplicitInterests: ComputedRef<boolean>
  returnTo: ComputedRef<OnboardingScreen | ''>
  email: ComputedRef<string>
  patch: (patch: OnboardingFlowPatch) => Promise<void>
  goTo: (screen: OnboardingScreen, patch?: OnboardingFlowPatch) => Promise<void>
}

/** @deprecated Alias for ported screen props */
export type FlowState = OnboardingFlowState

/** @deprecated Alias for ported screen props */
export type Screen = OnboardingScreen

/** @deprecated Alias for ported screen props */
export type FlowPatch = OnboardingFlowPatch

function serializePatch(patch: OnboardingFlowPatch): Record<string, string | string[] | undefined> {
  const out: Record<string, string | string[] | undefined> = {}
  if ('title' in patch) out.title = patch.title?.trim() || undefined
  if ('username' in patch) out.username = patch.username?.trim() || undefined
  if ('survey' in patch) out.survey = patch.survey || undefined
  if ('email' in patch) out.email = patch.email?.trim() || undefined
  if ('interests' in patch) {
    const items = (patch.interests ?? []).map((item) => item.trim()).filter(Boolean)
    out.interests = items.length ? items : ''
  }
  if ('returnTo' in patch) {
    const target = patch.returnTo
    out.returnTo = target && isScreen(target) ? target : undefined
  }
  return out
}

function mergeQuery(
  current: LocationQuery,
  updates: Record<string, string | string[] | undefined>,
): LocationQueryRaw {
  const next: LocationQueryRaw = { ...current }
  for (const [key, value] of Object.entries(updates)) {
    if (value === undefined) {
      delete next[key]
    } else {
      next[key] = value
    }
  }
  return next
}

export function useWikitaLiteOnboardingFlow(): OnboardingFlowState {
  const route = useRoute()
  const router = useRouter()

  const screen = computed<OnboardingScreen>(() => {
    const raw = firstString(route.query.screen)
    return isScreen(raw) ? raw : DEFAULT_SCREEN
  })

  const title = computed(() => firstString(route.query.title).trim())
  const username = computed(() => firstString(route.query.username).trim())
  const email = computed(() => firstString(route.query.email).trim())

  function patch(next: OnboardingFlowPatch): Promise<void> {
    return router.replace({ query: mergeQuery(route.query, serializePatch(next)) }).then(() => undefined)
  }

  function goTo(target: OnboardingScreen, next?: OnboardingFlowPatch): Promise<void> {
    const updates = next ? serializePatch(next) : {}
    updates.screen = target === DEFAULT_SCREEN ? undefined : target
    return router.push({ query: mergeQuery(route.query, updates) }).then(() => undefined)
  }

  const survey = computed<SurveyChoice | ''>({
    get() {
      const raw = firstString(route.query.survey)
      return (SURVEY_CHOICES as string[]).includes(raw) ? (raw as SurveyChoice) : ''
    },
    set(value) {
      patch({ survey: value })
    },
  })

  const interests = computed<string[]>({
    get() {
      const raw = route.query.interests
      if (raw === undefined) {
        return title.value ? [title.value] : []
      }
      const list = Array.isArray(raw) ? raw : [raw]
      return list.map((item) => (item ?? '').trim()).filter(Boolean)
    },
    set(value) {
      patch({ interests: value })
    },
  })

  const hasExplicitInterests = computed(() => route.query.interests !== undefined)

  const returnTo = computed<OnboardingScreen | ''>(() => {
    const raw = firstString(route.query.returnTo)
    return isScreen(raw) ? raw : ''
  })

  return {
    screen,
    title,
    username,
    survey,
    interests,
    hasExplicitInterests,
    returnTo,
    email,
    patch,
    goTo,
  }
}
