import { computed, ref } from 'vue'

import { loadHomeConfig, patchHomeConfig, type HomeConfig } from './data/homeConfig'
import { DEFAULT_TAB_BAR, type HomeTabSlot } from './data/tabBar'

// Module-level, like the Home layout: every reader of the tab bar sees one list.
// Read on first use, not at import, so it sees `?reset`.
const stored = ref<HomeConfig['tabBar'] | undefined>(undefined)

/** The mobile tab bar's editable tabs (after Home), and the edits "Prototype settings" makes. */
export function useHomeTabBar() {
  if (stored.value === undefined) stored.value = loadHomeConfig().tabBar

  const slots = computed<HomeTabSlot[]>(() =>
    (stored.value ?? DEFAULT_TAB_BAR).map((slot) => ({ ...slot })),
  )

  /** Save the whole list: the first change pins it, so a later default can't shift it. */
  function save(next: HomeTabSlot[]): void {
    stored.value = patchHomeConfig({ tabBar: next }).tabBar
  }

  function update(id: string, change: Partial<Omit<HomeTabSlot, 'id'>>): void {
    save(slots.value.map((slot) => (slot.id === id ? { ...slot, ...change } : slot)))
  }

  function setIcon(id: string, icon: string | null): void {
    update(id, { icon })
  }

  function setDestination(id: string, destination: string): void {
    update(id, { destination })
  }

  /** Empty the tab at `index` and move it to the bottom, after the tabs still in use. */
  function clear(index: number): void {
    const next = slots.value
    const [slot] = next.splice(index, 1)
    save([...next, { ...slot, icon: null, destination: '' }])
  }

  /** Move the tab at `from` to `to`. */
  function move(from: number, to: number): void {
    if (from === to) return
    const next = slots.value
    next.splice(to, 0, ...next.splice(from, 1))
    save(next)
  }

  return { slots, setIcon, setDestination, clear, move }
}
