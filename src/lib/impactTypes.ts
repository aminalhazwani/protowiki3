/** Serializable Impact module props (matches template-homepage ImpactModule). */

export interface ImpactMostViewedArticle {
  title: string
  views: number
  thumbnailSrc?: string
  href?: string
  sparklineData?: number[]
}

export interface ImpactData {
  viewCount?: string
  viewLabel?: string
  sparklineData?: number[]
  lastEdited?: string
  longestStreak?: string
  thanksReceived?: number
  totalEdits?: number
  recentActivityData?: number[]
  activityStartDate?: string
  activityEndDate?: string
  mostViewed?: ImpactMostViewedArticle[]
  viewAllEditsHref?: string
  /** Titles edited (namespace 0) — used to sync config editedPages. */
  editedPageTitles?: string[]
}

export const EMPTY_IMPACT_DATA: ImpactData = {
  thanksReceived: 0,
  recentActivityData: [],
  mostViewed: [],
  sparklineData: [],
}
