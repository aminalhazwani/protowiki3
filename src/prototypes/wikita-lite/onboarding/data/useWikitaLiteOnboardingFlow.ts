import { computed, type ComputedRef, type WritableComputedRef } from 'vue'
import { useRoute, useRouter, type LocationQuery, type LocationQueryRaw } from 'vue-router'

import { normalizeEnwikiTitle } from '../../../musical-group/data/enwikiTitle'
import { mergeWikitaLiteQuery, type WikitaLiteUrlStatePatch } from '../../data/urlStateSchema'
import { defaultOnboardingInterests, isOnboardingSeedTitle } from './defaultOnboardingInterests'

/**
 * URL-query state for the wikita-lite onboarding flow.
 *
 * The route's query string is the single source of truth: every screen reads
 * from and writes to it, so each step is deep-linkable, shareable, and gets
 * browser back/forward for free.
 *
 * Interest pre-fill on the interests step comes from `?title=` only (the article
 * the user saved or started account creation from). `?interests=` is written
 * only after the user edits on that step.
 */

export const ONBOARDING_SCREENS = [
  'search',
  'article',
  'account',
  'welcome',
  'survey',
  'interests',
  'home',
] as const

export type OnboardingScreen = (typeof ONBOARDING_SCREENS)[number]

export type SurveyChoice = 'read' | 'edit' | 'both'

const SURVEY_CHOICES: SurveyChoice[] = ['read', 'edit', 'both']

const DEFAULT_SCREEN: OnboardingScreen = 'article'

function firstString(value: LocationQuery[string]): string {
  if (Array.isArray(value)) return value[0] ?? ''
  return typeof value === 'string' ? value : ''
}

function isScreen(value: string): value is OnboardingScreen {
  return (ONBOARDING_SCREENS as readonly string[]).includes(value)
}

export function parseOnboardingScreen(raw: string): OnboardingScreen {
  if (raw === 'read') return 'article'
  return isScreen(raw) ? raw : DEFAULT_SCREEN
}

function readExplicitInterests(query: LocationQuery): string[] {
  const raw = query.interests
  if (raw === undefined) return []
  const list = Array.isArray(raw) ? raw : [raw]
  return list.map((item) => (item ?? '').trim()).filter(Boolean)
}

function normalizeArticleTitle(raw: string): string {
  return raw.replace(/_/g, ' ').trim()
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
  /** Virtual pre-fill from `?title=` when `?interests=` is absent. */
  prefillInterests: ComputedRef<string[]>
  username: ComputedRef<string>
  survey: WritableComputedRef<SurveyChoice | ''>
  interests: WritableComputedRef<string[]>
  hasExplicitInterests: ComputedRef<boolean>
  returnTo: ComputedRef<OnboardingScreen | ''>
  email: ComputedRef<string>
  patch: (patch: OnboardingFlowPatch) => Promise<void>
  goTo: (screen: OnboardingScreen, patch?: OnboardingFlowPatch) => Promise<void>
  /** Save sheet → Create account: writes ?saved= / ?savedTs= and opens account. */
  goToAccountFromSave: (title: string) => Promise<void>
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

  const screen = computed<OnboardingScreen>(() =>
    parseOnboardingScreen(firstString(route.query.screen)),
  )

  const title = computed(() => firstString(route.query.title).trim())

  const username = computed(() => firstString(route.query.username).trim())

  const email = computed(() => firstString(route.query.email).trim())

  const prefillInterests = computed(() =>
    defaultOnboardingInterests([normalizeArticleTitle(title.value)]),
  )

  function patch(next: OnboardingFlowPatch): Promise<void> {
    return router
      .replace({ query: mergeWikitaLiteQuery(route.query, onboardingPatchToUrlPatch(next)) })
      .then(() => undefined)
  }

  function goTo(target: OnboardingScreen, next?: OnboardingFlowPatch): Promise<void> {
    const updates = next ? onboardingPatchToUrlPatch(next) : {}

    if (target === 'home') {
      // Home drops `?title=`, and the interests list is only a virtual prefill
      // derived from it until the user edits on the interests step. Materialize
      // it here so the seed article survives as a real interest.
      if (updates.interests === undefined) updates.interests = interests.value
      updates.title = ''
    }

    return router
      .push({
        query: mergeQuery(route.query, {
          ...updates,
          screen: target,
        }),
      })
      .then(() => undefined)
  }

  function goToAccountFromSave(rawTitle: string): Promise<void> {
    const normalized = normalizeEnwikiTitle(rawTitle.replace(/_/g, ' ').trim())
    if (!normalized || !isOnboardingSeedTitle(normalized)) {
      return goTo('account')
    }

    return router
      .push({
        query: mergeQuery(route.query, {
          screen: 'account',
          saved: [normalized],
          savedTs: [String(Date.now())],
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
      const explicit = readExplicitInterests(route.query)
      if (route.query.interests !== undefined) return explicit
      return prefillInterests.value
    },
    set(value) {
      patch({ interests: value })
    },
  })

  const hasExplicitInterests = computed(() => route.query.interests !== undefined)

  const returnTo = computed<OnboardingScreen | ''>(() => {
    const raw = firstString(route.query.returnTo).trim()
    if (!raw) return ''
    if (raw === 'read') return 'article'
    return isScreen(raw) ? raw : ''
  })

  // Drop legacy session-scoped seeds from an earlier iteration.
  try {
    sessionStorage.removeItem('wikita-lite-onboarding-interest-seeds')
  } catch {
    // ignore
  }

  return {
    screen,
    title,
    prefillInterests,
    username,
    survey,
    interests,
    hasExplicitInterests,
    returnTo,
    email,
    patch,
    goTo,
    goToAccountFromSave,
  }
}
