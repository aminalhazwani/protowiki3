import { computed, type CSSProperties } from 'vue'

import {
  defaultConfigureListOrder,
  isConfigurableHomeModuleId,
  isModuleEnabledByDefault,
  reorderHomeModules,
  resolveHomeLayout,
  toggleHomeModule,
  type ConfigurableHomeModuleId,
  type HomeLayoutOverrides,
} from '../data/homeLayout'
import { useWikitaLiteRoute } from './useWikitaLiteRoute'
import { useWikitaLiteUrlState } from './useWikitaLiteUrlState'

export function useWikitaLiteHomeLayout() {
  const { state } = useWikitaLiteUrlState()
  const { replaceQuery } = useWikitaLiteRoute()

  const resolved = computed(() =>
    resolveHomeLayout(state.value.mode, state.value.homeLayout),
  )

  function isLayoutModuleEnabled(moduleId: string): boolean {
    if (!isConfigurableHomeModuleId(moduleId)) return false
    return resolved.value.enabledIds.has(moduleId)
  }

  function layoutModuleOrderStyle(moduleId: string): CSSProperties {
    if (!isConfigurableHomeModuleId(moduleId)) return {}
    const index = resolved.value.visibleOrder.indexOf(moduleId)
    if (index === -1) return {}
    return { order: index }
  }

  function isModuleEnabledInConfigure(moduleId: ConfigurableHomeModuleId): boolean {
    return resolved.value.enabledIds.has(moduleId)
  }

  const configureOrder = computed(() => resolved.value.configureOrder)

  async function commitHomeLayout(overrides: HomeLayoutOverrides): Promise<void> {
    await replaceQuery({ homeLayout: overrides })
  }

  async function setModuleEnabled(
    moduleId: ConfigurableHomeModuleId,
    enabled: boolean,
  ): Promise<void> {
    const next = toggleHomeModule(state.value.mode, state.value.homeLayout, moduleId, enabled)
    await commitHomeLayout(next)
  }

  async function setConfigureOrder(order: ConfigurableHomeModuleId[]): Promise<void> {
    const next = reorderHomeModules(state.value.homeLayout, order)
    await commitHomeLayout(next)
  }

  return {
    resolved,
    configureOrder,
    defaultConfigureListOrder: computed(() => defaultConfigureListOrder(state.value.mode)),
    isModuleEnabledByDefault: (moduleId: ConfigurableHomeModuleId) =>
      isModuleEnabledByDefault(state.value.mode, moduleId),
    isLayoutModuleEnabled,
    isModuleEnabledInConfigure,
    layoutModuleOrderStyle,
    setModuleEnabled,
    setConfigureOrder,
  }
}
