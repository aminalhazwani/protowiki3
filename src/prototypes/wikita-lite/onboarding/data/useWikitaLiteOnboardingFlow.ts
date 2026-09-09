import { computed, type ComputedRef, type WritableComputedRef } from 'vue'
import { useRoute, useRouter, type LocationQuery, type LocationQueryRaw } from 'vue-router'

import { mergeWikitaLiteQuery, type WikitaLiteUrlStatePatch } from '../../data/urlStateSchema'
import { defaultOnboardingInterests } from './defaultOnboardingInterests'

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
  searchedTitle?: string
  saveTitle?: string
  username?: string
  survey?: SurveyChoice | ''
  interests?: string[]
  email?: string
  returnTo?: OnboardingScreen | ''
}

export interface OnboardingFlowState {
  screen: ComputedRef<OnboardingScreen>
  title: ComputedRef<string>
  searchedTitle: ComputedRef<string>
  saveTitle: ComputedRef<string>
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

function onboardingPatchToUrlPatch(patch: OnboardingFlowPatch): WikitaLiteUrlStatePatch {
  const out: WikitaLiteUrlStatePatch = {}
  if ('title' in patch) out.title = patch.title?.trim() || ''
  if ('searchedTitle' in patch) out.searchedTitle = patch.searchedTitle?.trim() || ''
  if ('saveTitle' in patch) out.saveTitle = patch.saveTitle?.trim() || ''
  if ('username' in patch) out.username = patch.username?.trim() || ''
  if ('survey' in patch) out.survey = patch.survey || ''
  if ('email' in patch) out.email = patch.email?.trim() || ''
  if ('interests' in patch) {
    out.interests = (patch.interests ?? []).map((item) => item.trim()).filter(Boolean)
  }
  if ('returnTo' in patch) {
    const target = patch.returnTo
    out.returnTo = target && isScreen(target) ? target : ''
  }
  return out
}

function mergeQuery(
  current: LocationQuery,
  updates: WikitaLiteUrlStatePatch & { screen?: OnboardingScreen | undefined },
): LocationQueryRaw {
  const urlPatch: WikitaLiteUrlStatePatch = { ...updates }
  if ('screen' in updates) {
    urlPatch.screen = updates.screen ?? DEFAULT_SCREEN
  }
  return mergeWikitaLiteQuery(current, urlPatch)
}

export function useWikitaLiteOnboardingFlow(): OnboardingFlowState {
  const route = useRoute()
  const router = useRouter()

  const screen = computed<OnboardingScreen>(() => {
    const raw = firstString(route.query.screen)
    return isScreen(raw) ? raw : DEFAULT_SCREEN
  })

  const title = computed(() => firstString(route.query.title).trim())
  const searchedTitle = computed(() => firstString(route.query.searchedTitle).trim())
  const saveTitle = computed(() => firstString(route.query.saveTitle).trim())
  const username = computed(() => firstString(route.query.username).trim())
  const email = computed(() => firstString(route.query.email).trim())

  function patch(next: OnboardingFlowPatch): Promise<void> {
    return router
      .replace({ query: mergeWikitaLiteQuery(route.query, onboardingPatchToUrlPatch(next)) })
      .then(() => undefined)
  }

  function goTo(target: OnboardingScreen, next?: OnboardingFlowPatch): Promise<void> {
    const updates = next ? onboardingPatchToUrlPatch(next) : {}
    return router
      .push({
        query: mergeQuery(route.query, {
          ...updates,
          screen: target === DEFAULT_SCREEN ? undefined : target,
        }),
      })
      .then(() => undefined)
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
        return defaultOnboardingInterests({
          searchedTitle: searchedTitle.value,
          saveTitle: saveTitle.value,
          title: title.value,
        })
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
    searchedTitle,
    saveTitle,
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
