import { computed, ref } from 'vue'

import { loadHomeConfig, patchHomeConfig, type HomeConfig } from './data/homeConfig'
import { resolveHomeLayout } from './data/homeLayout'
import { HOME_MODULES, type HomeAnyModuleSpec, type HomeModuleId } from './modules'
import { useHomeOnboarding } from './useHomeOnboarding'

const MODULE_IDS = HOME_MODULES.map((spec) => spec.id)

// Module-level: the dashboard and the "Home layout" dialog edit the same layout.
// Read on first use, not at import, so it sees `?reset` (applied as the Home page sets up).
const stored = ref<HomeConfig['layout'] | undefined>(undefined)

/** The reader's Home layout: which modules show, in what order (`data/homeLayout.ts`). */
export function useHomeLayout() {
  if (stored.value === undefined) stored.value = loadHomeConfig().layout

  // Until the reader changes it, the layout follows their onboarding survey answer.
  const { survey } = useHomeOnboarding()
  const layout = computed(() => resolveHomeLayout(stored.value ?? null, MODULE_IDS, survey.value))

  /** Every module, in layout order. */
  const modules = computed(() =>
    layout.value.order.map((id) => HOME_MODULES.find((spec) => spec.id === id)!),
  )

  /** The modules the Home shows, in order. */
  const visibleModules = computed(() => modules.value.filter((spec) => isOn(spec.id)))

  function isOn(id: HomeModuleId): boolean {
    return layout.value.on.includes(id)
  }

  /** Save a layout. The first change saves the whole of it, so later defaults don't shift it. */
  function save(order: HomeModuleId[], on: HomeModuleId[]): void {
    stored.value = patchHomeConfig({
      layout: { order, on: order.filter((id) => on.includes(id)) },
    }).layout
  }

  /** Switch a module on or off. */
  function setOn(id: HomeModuleId, on: boolean): void {
    const current = layout.value.on
    save(layout.value.order, on ? [...current, id] : current.filter((other) => other !== id))
  }

  /** Move the module at `from` to `to` (indexes into `modules`). */
  function move(from: number, to: number): void {
    if (from === to) return
    const order = [...layout.value.order]
    order.splice(to, 0, ...order.splice(from, 1))
    save(order, layout.value.on)
  }

  return { modules, visibleModules, isOn, setOn, move }
}

/** A module's name in the "Home layout" list. */
export function layoutLabel(spec: HomeAnyModuleSpec): string {
  if (spec.layoutLabel) return spec.layoutLabel
  return typeof spec.title === 'function' ? spec.title() : spec.title
}
