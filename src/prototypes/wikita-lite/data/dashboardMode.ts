export const SIMPLIFIED_MODULE_IDS = [
  'suggestedEdits',
  'furtherReading',
  'impact',
  'mentor',
] as const

export type SimplifiedModuleId = (typeof SIMPLIFIED_MODULE_IDS)[number]

export type WikitaLiteDashboardMode = 'both' | 'read' | 'edit' | 'advanced'

export type SimplifiedDashboardMode = Exclude<WikitaLiteDashboardMode, 'advanced'>

export const DASHBOARD_MODES: WikitaLiteDashboardMode[] = [
  'both',
  'read',
  'edit',
  'advanced',
]

export const SIMPLIFIED_DASHBOARD_MODES: SimplifiedDashboardMode[] = [
  'both',
  'read',
  'edit',
]

export const DEFAULT_DASHBOARD_MODE: SimplifiedDashboardMode = 'both'

export const MODE_MODULE_ORDER: Record<SimplifiedDashboardMode, SimplifiedModuleId[]> = {
  both: ['suggestedEdits', 'furtherReading', 'impact', 'mentor'],
  read: ['furtherReading', 'suggestedEdits', 'impact', 'mentor'],
  edit: ['suggestedEdits', 'impact', 'mentor', 'furtherReading'],
}

export function isSimplifiedDashboardMode(
  mode: WikitaLiteDashboardMode,
): mode is SimplifiedDashboardMode {
  return mode !== 'advanced'
}

export function parseDashboardMode(raw: unknown): WikitaLiteDashboardMode | null {
  if (typeof raw !== 'string') return null
  return (DASHBOARD_MODES as readonly string[]).includes(raw)
    ? (raw as WikitaLiteDashboardMode)
    : null
}

export function isSimplifiedModuleId(id: string): id is SimplifiedModuleId {
  return (SIMPLIFIED_MODULE_IDS as readonly string[]).includes(id)
}
