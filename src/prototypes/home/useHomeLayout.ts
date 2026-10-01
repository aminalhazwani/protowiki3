import { computed, ref } from 'vue'

import { loadHomeConfig, patchHomeConfig, type HomeConfig } from './data/homeConfig'
import { resolveHomeLayout } from './data/homeLayout'
import { HOME_MODULES, type HomeAnyModuleSpec, type HomeModuleId } from './modules'

const MODULE_IDS = HOME_MODULES.map((spec) => spec.id)

// Module-level: the dashboard and the "Home layout" dialog edit the same layout.
// Read on first use, not at import, so it sees `?reset` (applied as the Home page sets up).
const stored = ref<HomeConfig['layout'] | undefined>(undefined)

/** The reader's Home layout: which modules show, in what order (`data/homeLayout.ts`). */
export function useHomeLayout() {
  if (stored.value === undefined) stored.value = loadHomeConfig().layout

  const layout = computed(() => resolveHomeLayout(stored.value ?? null, MODULE_IDS))

  /** Every module, in layout order. */
  const modules = computed(() =>
    layout.value.order.map((id) => HOME_MODULES.find((spec) => spec.id === id)!),
  )

  /** The modules the Home shows, in order. */
  const visibleModules = computed(() => modules.value.filter((spec) => isOn(spec.id)))

  function isOn(id: HomeModuleId): boolean {
    return layout.value.on.includes(id)
  }

  /** Switch a module on or off. The first change saves the whole layout. */
  function setOn(id: HomeModuleId, on: boolean): void {
    const { order } = layout.value
    const next = on ? [...layout.value.on, id] : layout.value.on.filter((other) => other !== id)
    stored.value = patchHomeConfig({
      layout: { order, on: order.filter((m) => next.includes(m)) },
    }).layout
  }

  return { modules, visibleModules, isOn, setOn }
}

/** A module's name in the "Home layout" list. */
export function layoutLabel(spec: HomeAnyModuleSpec): string {
  if (spec.layoutLabel) return spec.layoutLabel
  return typeof spec.title === 'function' ? spec.title() : spec.title
}
