import { computed, ref } from 'vue'

import {
  loadHomeConfig,
  MAX_INTERESTS,
  patchHomeConfig,
  type HomeConfig,
  type HomeSources,
} from './data/homeConfig'

// Module-level: the dialog, the seeds and the personal modules share it. Read on
// first use, not at import, so it sees `?reset` (applied as the Home page sets up).
const config = ref<Pick<HomeConfig, 'interests' | 'sources'> | null>(null)

/** Whether the Personalization dialog is open (a personal module's "Configure" opens it). */
const open = ref(false)

/**
 * What shapes the personal modules (home2's Personalization): the reader's
 * interests, and which of their activity counts (saved pages, watchlist,
 * contributions). `useHomeSeeds` turns it into the pages suggestions grow from.
 */
export function useHomePersonalization() {
  config.value ??= loadHomeConfig()

  const interests = computed(() => config.value?.interests ?? [])
  const sources = computed(() => config.value!.sources)

  /** Changes whenever the personal modules should reload. */
  const version = computed(() => JSON.stringify(config.value))

  function save(partial: Partial<Pick<HomeConfig, 'interests' | 'sources'>>): void {
    const next = patchHomeConfig(partial)
    config.value = { interests: next.interests, sources: next.sources }
  }

  function setInterests(titles: string[]): void {
    save({ interests: titles.slice(0, MAX_INTERESTS) })
  }

  function setSource(key: keyof HomeSources, on: boolean): void {
    save({ sources: { ...sources.value, [key]: on } })
  }

  return { open, interests, sources, version, setInterests, setSource }
}
