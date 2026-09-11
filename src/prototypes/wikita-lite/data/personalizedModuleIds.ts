import type { WikitaLiteModuleId } from './homeModuleIds'

export const PERSONALIZED_MODULE_IDS = [
  'furtherReading',
  'suggestedEdits',
  'recentActivity',
] as const

export type PersonalizedModuleId = (typeof PERSONALIZED_MODULE_IDS)[number]

export function isPersonalizedModule(id: WikitaLiteModuleId): id is PersonalizedModuleId {
  return (PERSONALIZED_MODULE_IDS as readonly string[]).includes(id)
}
