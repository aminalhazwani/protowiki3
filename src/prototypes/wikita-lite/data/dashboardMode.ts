import type { SurveyChoice } from '../onboarding/data/useWikitaLiteOnboardingFlow'

export const SIMPLIFIED_MODULE_IDS = [
  'suggestedEdits',
  'furtherReading',
  'impact',
  'mentor',
] as const

export type SimplifiedModuleId = (typeof SIMPLIFIED_MODULE_IDS)[number]

export type WikitaLiteDashboardMode = 'both' | 'read' | 'edit'

export const DASHBOARD_MODES: WikitaLiteDashboardMode[] = ['both', 'read', 'edit']

export const DEFAULT_DASHBOARD_MODE: WikitaLiteDashboardMode = 'both'

export const MODE_MODULE_ORDER: Record<WikitaLiteDashboardMode, SimplifiedModuleId[]> = {
  both: ['suggestedEdits', 'furtherReading', 'impact', 'mentor'],
  read: ['furtherReading', 'suggestedEdits', 'impact', 'mentor'],
  edit: ['suggestedEdits', 'impact', 'mentor', 'furtherReading'],
}

export function parseDashboardMode(raw: unknown): WikitaLiteDashboardMode | null {
  if (typeof raw !== 'string') return null
  if (raw === 'advanced') return null
  return (DASHBOARD_MODES as readonly string[]).includes(raw)
    ? (raw as WikitaLiteDashboardMode)
    : null
}

export function resolveDashboardMode(
  urlMode: WikitaLiteDashboardMode | null,
  survey: SurveyChoice | '',
): WikitaLiteDashboardMode {
  return urlMode ?? (survey ? survey : DEFAULT_DASHBOARD_MODE)
}

export function isSimplifiedModuleId(id: string): id is SimplifiedModuleId {
  return (SIMPLIFIED_MODULE_IDS as readonly string[]).includes(id)
}
