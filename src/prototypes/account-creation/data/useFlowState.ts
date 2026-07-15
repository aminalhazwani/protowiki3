import { computed, type ComputedRef } from 'vue'
import { useRoute, useRouter, type LocationQuery, type LocationQueryRaw } from 'vue-router'

/**
 * URL-query state for the account-creation flow.
 *
 * The route's query string is the single source of truth: every screen reads
 * from and writes to it, so each step is deep-linkable, shareable, and gets
 * browser back/forward for free. Screen transitions push a new history entry.
 * Ephemeral text buffers (typing a title, a username) live locally in their
 * screens and are committed to the URL on the action.
 *
 * The flow is intentionally short: read an article, open the account menu, and
 * try to create an account. Account creation is a dead end in the prototype
 * (it just shows a confirmation), so there are no post-account screens.
 */

export const SCREENS = ['search', 'read', 'account'] as const

export type Screen = (typeof SCREENS)[number]

const DEFAULT_SCREEN: Screen = 'read'

function firstString(value: LocationQuery[string]): string {
  if (Array.isArray(value)) return value[0] ?? ''
  return typeof value === 'string' ? value : ''
}

function isScreen(value: string): value is Screen {
  return (SCREENS as readonly string[]).includes(value)
}

export interface FlowPatch {
  title?: string
  username?: string
}

export interface FlowState {
  /** Active screen (defaults to `read`). */
  screen: ComputedRef<Screen>
  /** Seed article the reader picked at the start. */
  title: ComputedRef<string>
  /** Username captured on the create-account screen. */
  username: ComputedRef<string>
  /** Merge `patch` into the query without changing the screen (history replace). */
  patch: (patch: FlowPatch) => Promise<void>
  /** Navigate to `screen`, optionally merging `patch` (history push). */
  goTo: (screen: Screen, patch?: FlowPatch) => Promise<void>
}

function serializePatch(patch: FlowPatch): Record<string, string | undefined> {
  const out: Record<string, string | undefined> = {}
  if ('title' in patch) out.title = patch.title?.trim() || undefined
  if ('username' in patch) out.username = patch.username?.trim() || undefined
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

export function useFlowState(): FlowState {
  const route = useRoute()
  const router = useRouter()

  const screen = computed<Screen>(() => {
    const raw = firstString(route.query.screen)
    return isScreen(raw) ? raw : DEFAULT_SCREEN
  })

  const title = computed(() => firstString(route.query.title).trim())
  const username = computed(() => firstString(route.query.username).trim())

  function patch(next: FlowPatch): Promise<void> {
    return router
      .replace({ query: mergeQuery(route.query, serializePatch(next)) })
      .then(() => undefined)
  }

  function goTo(target: Screen, next?: FlowPatch): Promise<void> {
    const updates: Record<string, string | undefined> = next ? serializePatch(next) : {}
    updates.screen = target === DEFAULT_SCREEN ? undefined : target
    return router.push({ query: mergeQuery(route.query, updates) }).then(() => undefined)
  }

  return {
    screen,
    title,
    username,
    patch,
    goTo,
  }
}
