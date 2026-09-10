<script setup lang="ts">
import { computed, watch } from 'vue'

import { CdxProgressBar, CdxTab, CdxTabs } from '@wikimedia/codex'

import { useConfig } from '@/composables/useConfig'

import { useWikitaSaveFeedback } from '../musical-group/composables/useWikitaSaveFeedback'
import { useWikitaLiteHome, type PersonalizedFeedId } from './composables/useWikitaLiteHome'
import { useWikitaLiteContributeModuleOrder } from './composables/useWikitaLiteContributeModuleOrder'
import { useWikitaLiteDashboardMode } from './composables/useWikitaLiteDashboardMode'
import { useWikitaLiteDismissedModulesSingleton } from './composables/useWikitaLiteDismissedModules'
import { useWikitaLiteExploreModuleOrder } from './composables/useWikitaLiteExploreModuleOrder'
import { useWikitaLiteHideTabBarSingleton } from './composables/useWikitaLiteHideTabBar'
import { useWikitaLiteHomeLayout } from './composables/useWikitaLiteHomeLayout'
import { useWikitaLiteImpact } from './composables/useWikitaLiteImpact'
import { useWikitaLiteMentor } from './composables/useWikitaLiteMentor'
import { useWikitaLiteTabLoading } from './composables/useWikitaLiteTabLoading'
import { useWikitaLiteRoute } from './composables/useWikitaLiteRoute'
import { useWikitaLiteView } from './composables/useWikitaLiteView'
import WikitaLiteInterestsEmptyState from './components/WikitaLiteInterestsEmptyState.vue'
import WikitaLiteModule from './components/WikitaLiteModule.vue'
import ActiveDiscussionsModule from './modules/ActiveDiscussionsModule.vue'
import DidYouKnowModule from './modules/DidYouKnowModule.vue'
import FeaturedModule from './modules/FeaturedModule.vue'
import HelpWantedModule from './modules/HelpWantedModule.vue'
import ImpactModule from './modules/ImpactModule.vue'
import LearnModule from './modules/LearnModule.vue'
import MentorModule from './modules/MentorModule.vue'
import MentionsModule from './modules/MentionsModule.vue'
import RecentActivityModule from './modules/RecentActivityModule.vue'
import RelatedModule from './modules/RelatedModule.vue'
import SavedModule from './modules/SavedModule.vue'
import TranslationModule from './modules/TranslationModule.vue'
import TrendingModule from './modules/TrendingModule.vue'
import {
  ACTIVE_DISCUSSIONS_PAGE,
  DID_YOU_KNOW_PAGE,
  FEATURED_PAGE,
  FURTHER_READING_PAGE,
  HELP_WANTED_PAGE,
  IMPACT_PAGE,
  LEARN_PAGE,
  MENTIONS_PAGE,
  MODULE_TITLES,
  RECENT_ACTIVITY_PAGE,
  recentActivityTitleForView,
  SAVED_PAGE,
  TRANSLATIONS_PAGE,
  TRENDING_PAGE,
  VIEW_TAB_LABELS,
  type WikitaLiteView,
} from './routes'

const HOME_FEATURED_PREVIEW_LIMIT = 3
const HOME_DYK_PREVIEW_LIMIT = 2
const HOME_TRENDING_PREVIEW_LIMIT = 2
const EXPLORE_UNSAVED_DYK_PREVIEW_LIMIT = 3
const HOME_SAVED_PREVIEW_LIMIT = 5
const HOME_MENTIONS_PREVIEW_LIMIT = 3
const HOME_FURTHER_READING_PREVIEW_LIMIT = 3
const HOME_HELP_WANTED_PREVIEW_LIMIT = 3
const HOME_RECENT_ACTIVITY_PREVIEW_LIMIT = 3
const UNSAVED_HELP_WANTED_PREVIEW_LIMIT = 1
const UNSAVED_RECENT_ACTIVITY_PREVIEW_LIMIT = 1
const HOME_ACTIVE_DISCUSSIONS_PREVIEW_LIMIT = 2
const HOME_TRANSLATION_PREVIEW_LIMIT = 2

const { listsVersion } = useWikitaSaveFeedback()
const { knownLanguages } = useConfig()
const { wikitaLiteRoute } = useWikitaLiteRoute()
const { activeView, selectView } = useWikitaLiteView()
const { impactCardProps, impactLoading, impactHasContent } = useWikitaLiteImpact()
const { moduleTitle: mentorModuleTitle } = useWikitaLiteMentor()

const impactPreviewCount = computed(() => (impactHasContent.value ? 1 : 0))
const impactEmptyPending = computed(() => impactLoading.value && !impactHasContent.value)
const { exploreModuleOrderStyle } = useWikitaLiteExploreModuleOrder()
const { contributeModuleOrderStyle } = useWikitaLiteContributeModuleOrder()
const { isDismissed } = useWikitaLiteDismissedModulesSingleton()
const { hideTabBar } = useWikitaLiteHideTabBarSingleton()
const { isLayoutModuleEnabled, layoutModuleOrderStyle } = useWikitaLiteHomeLayout()
const { dashboardMode } = useWikitaLiteDashboardMode()

let getBookmarkChangeSkipFeeds: () => PersonalizedFeedId[] = () => []

const {
  featuredArticle,
  featuredTabLoading,
  featuredTabError,
  retryFeaturedFeed,
  trendingItems,
  trendingLoading,
  trendingTabError,
  retryTrendingFeed,
  didYouKnow,
  hasSavedPages,
  suggestionSeedsAvailable,
  showSavedBasedMentions,
  recentlySaved,
  savedItemsLoading,
  ensureReadingListSummaries,
  homeRelatedItems,
  homeRelatedLoading,
  homeMentions,
  homeMentionsLoading,
  helpWanted,
  helpWantedLoading,
  recentChanges,
  recentChangesLoading,
  activeDiscussions,
  activeDiscussionsLoading,
  activeDiscussionsError,
  retryActiveDiscussionsFeed,
  translationSuggestions,
  translationLoading,
  translationError,
  retryTranslationFeed,
} = useWikitaLiteHome({ getBookmarkChangeSkipFeeds: () => getBookmarkChangeSkipFeeds() })

const featuredHasContent = computed(() => Boolean(featuredArticle.value))

const featuredPreviewCount = computed(() => (featuredHasContent.value ? 1 : 0))

const trendingPreviewCount = computed(() => trendingItems.value.length)

const homeRelatedPreviewCount = computed(() => homeRelatedItems.value.length)

const homeMentionsPreview = computed(() =>
  homeMentions.value.slice(0, HOME_MENTIONS_PREVIEW_LIMIT),
)

const helpWantedPreviewLimit = computed(() =>
  suggestionSeedsAvailable.value || hasSavedPages.value
    ? HOME_HELP_WANTED_PREVIEW_LIMIT
    : UNSAVED_HELP_WANTED_PREVIEW_LIMIT,
)

const recentActivityPreviewLimit = computed(() =>
  suggestionSeedsAvailable.value
    ? HOME_RECENT_ACTIVITY_PREVIEW_LIMIT
    : UNSAVED_RECENT_ACTIVITY_PREVIEW_LIMIT,
)

const helpWantedPreview = computed(() =>
  helpWanted.value.slice(0, helpWantedPreviewLimit.value),
)

const furtherReadingEmptyPending = computed(
  () =>
    suggestionSeedsAvailable.value &&
    homeRelatedPreviewCount.value === 0 &&
    homeRelatedLoading.value,
)
const suggestedEditsEmptyPending = computed(
  () =>
    suggestionSeedsAvailable.value &&
    helpWantedPreview.value.length === 0 &&
    helpWantedLoading.value,
)

const showFurtherReadingNoSeeds = computed(
  () =>
    dashboardMode.value === 'read' &&
    isLayoutModuleEnabled('furtherReading') &&
    !suggestionSeedsAvailable.value,
)
const showSuggestedEditsNoSeeds = computed(
  () =>
    (dashboardMode.value === 'both' || dashboardMode.value === 'edit') &&
    isLayoutModuleEnabled('suggestedEdits') &&
    !suggestionSeedsAvailable.value,
)

const furtherReadingPreviewCount = computed(
  () => homeRelatedPreviewCount.value || (showFurtherReadingNoSeeds.value ? 1 : 0),
)
const suggestedEditsPreviewCount = computed(
  () => helpWantedPreview.value.length || (showSuggestedEditsNoSeeds.value ? 1 : 0),
)

const recentActivityPreview = computed(() =>
  recentChanges.value.slice(0, recentActivityPreviewLimit.value),
)

const activeDiscussionsPreviewCount = computed(() => activeDiscussions.value.length)

const translationPreview = computed(() =>
  translationSuggestions.value.slice(0, HOME_TRANSLATION_PREVIEW_LIMIT),
)

const showActiveDiscussionsContent = computed(
  () => activeDiscussions.value.length > 0 || Boolean(activeDiscussionsError.value),
)

const activeDiscussionsPending = computed(
  () =>
    activeDiscussionsLoading.value &&
    !activeDiscussions.value.length &&
    !activeDiscussionsError.value,
)

const contributeActiveDiscussionsPending = computed(
  () =>
    activeDiscussionsLoading.value &&
    !activeDiscussions.value.length &&
    !activeDiscussionsError.value,
)

const exploreDidYouKnowPreviewLimit = computed(() =>
  hasSavedPages.value ? HOME_DYK_PREVIEW_LIMIT : EXPLORE_UNSAVED_DYK_PREVIEW_LIMIT,
)

const homeDidYouKnowPreview = computed(() =>
  didYouKnow.value.slice(0, exploreDidYouKnowPreviewLimit.value),
)

const homePinnedDidYouKnowPreview = computed(() =>
  didYouKnow.value.slice(0, HOME_DYK_PREVIEW_LIMIT),
)

const showDidYouKnowOnHome = computed(
  () =>
    isLayoutModuleEnabled('didYouKnow') &&
    !isDismissed('didYouKnow') &&
    (homePinnedDidYouKnowPreview.value.length > 0 || featuredTabLoading.value),
)

const showSavedOnHome = computed(
  () => isLayoutModuleEnabled('saved') && !isDismissed('saved'),
)

watch(
  () => [hasSavedPages.value, showSavedOnHome.value, activeView.value] as const,
  ([saved, savedOnHome, view]) => {
    if (saved && (savedOnHome || view === 'read')) {
      void ensureReadingListSummaries()
    }
  },
  { immediate: true },
)

const showTranslationModule = computed(() => knownLanguages.value.length > 0)

const recentActivityTitle = computed(() => recentActivityTitleForView(activeView.value))

function isRecentActivityVisible(): boolean {
  return recentChangesLoading.value || recentActivityPreview.value.length > 0
}

const translationPending = computed(
  () =>
    showTranslationModule.value &&
    translationLoading.value &&
    !translationPreview.value.length &&
    !translationError.value,
)

const editTab = useWikitaLiteTabLoading([
  {
    id: 'featured',
    loading: featuredTabLoading,
    previewCount: featuredPreviewCount,
    hasError: featuredTabError,
    enabled: computed(() => isLayoutModuleEnabled('featured')),
  },
  {
    id: 'trending',
    loading: trendingLoading,
    previewCount: trendingPreviewCount,
    hasError: trendingTabError,
    enabled: computed(() => isLayoutModuleEnabled('trending')),
  },
  {
    id: 'furtherReading',
    loading: homeRelatedLoading,
    previewCount: furtherReadingPreviewCount,
    emptyPending: furtherReadingEmptyPending,
    enabled: computed(() => isLayoutModuleEnabled('furtherReading')),
  },
  {
    id: 'suggestedEdits',
    loading: helpWantedLoading,
    previewCount: suggestedEditsPreviewCount,
    emptyPending: suggestedEditsEmptyPending,
    enabled: computed(() => isLayoutModuleEnabled('suggestedEdits')),
  },
  {
    id: 'recentActivity',
    loading: recentChangesLoading,
    previewCount: computed(() => recentActivityPreview.value.length),
    enabled: computed(() => isLayoutModuleEnabled('recentActivity')),
  },
  {
    id: 'activeDiscussions',
    loading: activeDiscussionsLoading,
    previewCount: activeDiscussionsPreviewCount,
    emptyPending: activeDiscussionsPending,
    hasError: activeDiscussionsError,
    enabled: computed(() => isLayoutModuleEnabled('activeDiscussions')),
  },
  {
    id: 'impact',
    loading: impactLoading,
    previewCount: impactPreviewCount,
    emptyPending: impactEmptyPending,
    enabled: computed(() => isLayoutModuleEnabled('impact')),
  },
  {
    id: 'saved',
    loading: savedItemsLoading,
    previewCount: computed(() => recentlySaved.value.length),
    enabled: computed(() => isLayoutModuleEnabled('saved')),
  },
  {
    id: 'didYouKnow',
    loading: featuredTabLoading,
    previewCount: computed(() => homePinnedDidYouKnowPreview.value.length),
    enabled: computed(() => isLayoutModuleEnabled('didYouKnow')),
  },
])

const readExploreTab = useWikitaLiteTabLoading([
  {
    id: 'didYouKnow',
    loading: featuredTabLoading,
    previewCount: computed(() => homeDidYouKnowPreview.value.length),
  },
  {
    id: 'saved',
    loading: savedItemsLoading,
    previewCount: computed(() => recentlySaved.value.length),
    enabled: hasSavedPages,
  },
  {
    id: 'furtherReading',
    loading: homeRelatedLoading,
    previewCount: homeRelatedPreviewCount,
    emptyPending: furtherReadingEmptyPending,
    enabled: suggestionSeedsAvailable,
  },
  {
    id: 'mentions',
    loading: homeMentionsLoading,
    previewCount: computed(() => homeMentionsPreview.value.length),
    enabled: showSavedBasedMentions,
  },
])

const contributeTab = useWikitaLiteTabLoading([
  {
    id: 'suggestedEdits',
    loading: helpWantedLoading,
    previewCount: computed(() => helpWantedPreview.value.length),
    emptyPending: suggestedEditsEmptyPending,
  },
  {
    id: 'translation',
    loading: translationLoading,
    previewCount: computed(() => translationPreview.value.length),
    emptyPending: translationPending,
    hasError: translationError,
    enabled: showTranslationModule,
  },
  {
    id: 'recentActivity',
    loading: recentChangesLoading,
    previewCount: computed(() => recentActivityPreview.value.length),
  },
  {
    id: 'activeDiscussions',
    loading: activeDiscussionsLoading,
    previewCount: activeDiscussionsPreviewCount,
    emptyPending: contributeActiveDiscussionsPending,
    hasError: activeDiscussionsError,
  },
  {
    id: 'impact',
    loading: impactLoading,
    previewCount: impactPreviewCount,
    emptyPending: impactEmptyPending,
    enabled: computed(() => isLayoutModuleEnabled('impact')),
  },
])

function isFurtherReadingVisible(): boolean {
  return homeRelatedLoading.value || homeRelatedItems.value.length > 0
}

function isMentionsVisible(): boolean {
  return homeMentionsLoading.value || homeMentionsPreview.value.length > 0
}

function isSuggestedEditsVisible(): boolean {
  return helpWantedLoading.value || helpWantedPreview.value.length > 0
}

function onSelectView(view: string) {
  if (hideTabBar.value) return
  selectView(view as WikitaLiteView)
}

watch(hideTabBar, (enabled) => {
  if (enabled && activeView.value !== 'edit') {
    selectView('edit')
  }
})

getBookmarkChangeSkipFeeds = (): PersonalizedFeedId[] => {
  if (activeView.value === 'read') {
    const skip: PersonalizedFeedId[] = ['helpWanted', 'recentChanges']
    if (isFurtherReadingVisible()) skip.push('related')
    if (isMentionsVisible()) skip.push('mentions')
    return skip
  }

  if (!hasSavedPages.value && !suggestionSeedsAvailable.value) return []

  const skip: PersonalizedFeedId[] = []

  if (activeView.value === 'edit') {
    if (isFurtherReadingVisible()) skip.push('related')
    skip.push('mentions')
    if (isSuggestedEditsVisible()) skip.push('helpWanted')
    if (isRecentActivityVisible()) skip.push('recentChanges')
    return skip
  }

  if (activeView.value === 'contribute') {
    skip.push('related', 'mentions')
    if (isSuggestedEditsVisible()) skip.push('helpWanted')
    if (isRecentActivityVisible()) skip.push('recentChanges')
    return skip
  }

  return skip
}
</script>

<template>
  <CdxTabs
    :active="hideTabBar ? 'edit' : activeView"
    :class="['wikita-lite-home__tabs', { 'wikita-lite-home__tabs--home-only': hideTabBar }]"
    @update:active="onSelectView"
  >
    <CdxTab name="edit" :label="VIEW_TAB_LABELS.edit">
      <div class="wikita-lite-home__panel">
        <WikitaLiteModule
          v-if="editTab.showModule('featured') && !isDismissed('featured')"
          module-id="featured"
          :style="layoutModuleOrderStyle('featured')"
          :title="MODULE_TITLES.featured"
          :to="wikitaLiteRoute(FEATURED_PAGE)"
        >
          <div
            v-if="editTab.showLoadingBar('featured') && !featuredHasContent && !featuredTabError"
            class="wikita-lite-home__loading"
          >
            <CdxProgressBar inline aria-label="Loading featured" />
          </div>
          <FeaturedModule
            v-if="featuredHasContent || featuredTabError"
            :featured-article="featuredArticle"
            :error="featuredTabError"
            :preview-limit="HOME_FEATURED_PREVIEW_LIMIT"
            :lists-version="listsVersion"
            @retry="retryFeaturedFeed"
          >
            <template v-if="editTab.showLoadingBar('featured') && featuredHasContent" #after-cards>
              <div class="wikita-lite-home__loading">
                <CdxProgressBar inline aria-label="Loading featured" />
              </div>
            </template>
          </FeaturedModule>
        </WikitaLiteModule>

        <WikitaLiteModule
          v-if="editTab.showModule('trending') && !isDismissed('trending')"
          module-id="trending"
          :style="layoutModuleOrderStyle('trending')"
          :title="MODULE_TITLES.trending"
          :to="wikitaLiteRoute(TRENDING_PAGE)"
        >
          <div
            v-if="editTab.showLoadingBar('trending') && !trendingItems.length && !trendingTabError"
            class="wikita-lite-home__loading"
          >
            <CdxProgressBar inline aria-label="Loading trending" />
          </div>
          <TrendingModule
            v-if="trendingItems.length || trendingTabError"
            :items="trendingItems"
            :error="trendingTabError"
            :preview-limit="HOME_TRENDING_PREVIEW_LIMIT"
            :lists-version="listsVersion"
            :more-to="wikitaLiteRoute(TRENDING_PAGE)"
            @retry="retryTrendingFeed"
          >
            <template v-if="editTab.showLoadingBar('trending') && trendingItems.length" #after-cards>
              <div class="wikita-lite-home__loading">
                <CdxProgressBar inline aria-label="Loading trending" />
              </div>
            </template>
          </TrendingModule>
        </WikitaLiteModule>

        <WikitaLiteModule
          v-if="editTab.showModule('furtherReading') && !isDismissed('furtherReading')"
          module-id="furtherReading"
          :style="layoutModuleOrderStyle('furtherReading')"
          :title="MODULE_TITLES.furtherReading"
          :to="wikitaLiteRoute(FURTHER_READING_PAGE)"
        >
          <WikitaLiteInterestsEmptyState v-if="showFurtherReadingNoSeeds" />
          <div
            v-else-if="editTab.showLoadingBar('furtherReading') && !homeRelatedItems.length"
            class="wikita-lite-home__loading"
          >
            <CdxProgressBar inline aria-label="Loading daily reads" />
          </div>
          <RelatedModule
            v-else-if="homeRelatedItems.length"
            :items="homeRelatedItems"
            :loading="homeRelatedLoading"
            :preview-limit="HOME_FURTHER_READING_PREVIEW_LIMIT"
            :lists-version="listsVersion"
          >
            <template
              v-if="editTab.showLoadingBar('furtherReading') && homeRelatedItems.length"
              #after-cards
            >
              <div class="wikita-lite-home__loading">
                <CdxProgressBar inline aria-label="Loading daily reads" />
              </div>
            </template>
          </RelatedModule>
        </WikitaLiteModule>

        <WikitaLiteModule
          v-if="editTab.showModule('suggestedEdits') && !isDismissed('suggestedEdits')"
          module-id="suggestedEdits"
          :style="layoutModuleOrderStyle('suggestedEdits')"
          :title="MODULE_TITLES.suggestedEdits"
          :to="wikitaLiteRoute(HELP_WANTED_PAGE)"
        >
          <WikitaLiteInterestsEmptyState v-if="showSuggestedEditsNoSeeds" />
          <div
            v-else-if="helpWantedLoading && !helpWantedPreview.length"
            class="wikita-lite-home__loading"
          >
            <CdxProgressBar inline aria-label="Loading edit suggestions" />
          </div>
          <HelpWantedModule
            v-else-if="helpWantedPreview.length"
            :items="helpWantedPreview"
            :preview-limit="helpWantedPreviewLimit"
            :more-to="wikitaLiteRoute(HELP_WANTED_PAGE)"
          >
            <template
              v-if="helpWantedLoading && helpWantedPreview.length"
              #after-cards
            >
              <div class="wikita-lite-home__loading">
                <CdxProgressBar inline aria-label="Loading edit suggestions" />
              </div>
            </template>
          </HelpWantedModule>
        </WikitaLiteModule>

        <WikitaLiteModule
          v-if="editTab.showModule('recentActivity') && !isDismissed('recentActivity')"
          module-id="recentActivity"
          :style="layoutModuleOrderStyle('recentActivity')"
          :title="recentActivityTitle"
          :to="wikitaLiteRoute(RECENT_ACTIVITY_PAGE)"
        >
          <div
            v-if="editTab.showLoadingBar('recentActivity') && !recentActivityPreview.length"
            class="wikita-lite-home__loading"
          >
            <CdxProgressBar inline aria-label="Loading recent activity" />
          </div>
          <RecentActivityModule
            v-if="recentActivityPreview.length"
            :items="recentActivityPreview"
            :preview-limit="recentActivityPreviewLimit"
            :more-to="wikitaLiteRoute(RECENT_ACTIVITY_PAGE)"
          >
            <template
              v-if="editTab.showLoadingBar('recentActivity') && recentActivityPreview.length"
              #after-cards
            >
              <div class="wikita-lite-home__loading">
                <CdxProgressBar inline aria-label="Loading recent activity" />
              </div>
            </template>
          </RecentActivityModule>
        </WikitaLiteModule>

        <WikitaLiteModule
          v-if="editTab.showModule('activeDiscussions') && !isDismissed('activeDiscussions')"
          module-id="activeDiscussions"
          :style="layoutModuleOrderStyle('activeDiscussions')"
          :title="MODULE_TITLES.activeDiscussions"
          :to="wikitaLiteRoute(ACTIVE_DISCUSSIONS_PAGE)"
        >
          <div
            v-if="editTab.showLoadingBar('activeDiscussions') && !showActiveDiscussionsContent"
            class="wikita-lite-home__loading"
          >
            <CdxProgressBar inline aria-label="Loading active discussions" />
          </div>
          <ActiveDiscussionsModule
            v-if="showActiveDiscussionsContent"
            :items="activeDiscussions"
            :error="activeDiscussionsError"
            :preview-limit="HOME_ACTIVE_DISCUSSIONS_PREVIEW_LIMIT"
            :more-to="wikitaLiteRoute(ACTIVE_DISCUSSIONS_PAGE)"
            @retry="retryActiveDiscussionsFeed"
          >
            <template
              v-if="editTab.showLoadingBar('activeDiscussions') && showActiveDiscussionsContent"
              #after-cards
            >
              <div class="wikita-lite-home__loading">
                <CdxProgressBar inline aria-label="Loading active discussions" />
              </div>
            </template>
          </ActiveDiscussionsModule>
        </WikitaLiteModule>

        <WikitaLiteModule
          v-if="!isDismissed('impact') && editTab.showModule('impact')"
          module-id="impact"
          :style="layoutModuleOrderStyle('impact')"
          :title="MODULE_TITLES.impact"
          :to="wikitaLiteRoute(IMPACT_PAGE)"
        >
          <div
            v-if="editTab.showLoadingBar('impact') && !impactHasContent"
            class="wikita-lite-home__loading"
          >
            <CdxProgressBar inline aria-label="Loading your impact" />
          </div>
          <ImpactModule v-if="impactHasContent" v-bind="impactCardProps" />
          <div
            v-if="editTab.showLoadingBar('impact') && impactHasContent"
            class="wikita-lite-home__loading"
          >
            <CdxProgressBar inline aria-label="Loading your impact" />
          </div>
        </WikitaLiteModule>

        <WikitaLiteModule
          v-if="showDidYouKnowOnHome && editTab.showModule('didYouKnow')"
          module-id="didYouKnow"
          :style="layoutModuleOrderStyle('didYouKnow')"
          :title="MODULE_TITLES.didYouKnow"
          :to="wikitaLiteRoute(DID_YOU_KNOW_PAGE)"
        >
          <div
            v-if="editTab.showLoadingBar('didYouKnow') && !homePinnedDidYouKnowPreview.length"
            class="wikita-lite-home__loading"
          >
            <CdxProgressBar inline aria-label="Loading Did you know" />
          </div>
          <DidYouKnowModule
            v-if="homePinnedDidYouKnowPreview.length"
            :items="didYouKnow"
            :preview-limit="HOME_DYK_PREVIEW_LIMIT"
            :lists-version="listsVersion"
            :more-to="wikitaLiteRoute(DID_YOU_KNOW_PAGE)"
          />
        </WikitaLiteModule>

        <WikitaLiteModule
          v-if="showSavedOnHome && editTab.showModule('saved')"
          module-id="saved"
          :style="layoutModuleOrderStyle('saved')"
          :title="MODULE_TITLES.saved"
          :to="wikitaLiteRoute(SAVED_PAGE)"
        >
          <div
            v-if="editTab.showLoadingBar('saved') && hasSavedPages && !recentlySaved.length"
            class="wikita-lite-home__loading"
          >
            <CdxProgressBar inline aria-label="Loading saved pages" />
          </div>
          <SavedModule
            :items="hasSavedPages ? recentlySaved : []"
            :preview-limit="HOME_SAVED_PREVIEW_LIMIT"
            :more-to="wikitaLiteRoute(SAVED_PAGE)"
          />
        </WikitaLiteModule>

        <WikitaLiteModule
          v-if="isLayoutModuleEnabled('mentor') && !isDismissed('mentor')"
          module-id="mentor"
          :style="layoutModuleOrderStyle('mentor')"
          :title="mentorModuleTitle"
        >
          <MentorModule />
        </WikitaLiteModule>
      </div>
    </CdxTab>

    <CdxTab v-if="!hideTabBar" name="read" :label="VIEW_TAB_LABELS.read">
      <div class="wikita-lite-home__panel">
        <WikitaLiteModule
          v-if="readExploreTab.showModule('didYouKnow') && !isDismissed('didYouKnow')"
          module-id="didYouKnow"
          :style="exploreModuleOrderStyle('didYouKnow')"
          :title="MODULE_TITLES.didYouKnow"
          :to="wikitaLiteRoute(DID_YOU_KNOW_PAGE)"
        >
          <div
            v-if="readExploreTab.showLoadingBar('didYouKnow') && !homeDidYouKnowPreview.length"
            class="wikita-lite-home__loading"
          >
            <CdxProgressBar inline aria-label="Loading Did you know" />
          </div>
          <DidYouKnowModule
            v-if="homeDidYouKnowPreview.length"
            :items="didYouKnow"
            :preview-limit="exploreDidYouKnowPreviewLimit"
          >
            <template
              v-if="readExploreTab.showLoadingBar('didYouKnow') && homeDidYouKnowPreview.length"
              #after-cards
            >
              <div class="wikita-lite-home__loading">
                <CdxProgressBar inline aria-label="Loading Did you know" />
              </div>
            </template>
          </DidYouKnowModule>
        </WikitaLiteModule>

        <WikitaLiteModule
          v-if="!isDismissed('saved')"
          module-id="saved"
          :style="exploreModuleOrderStyle('saved')"
          :title="MODULE_TITLES.saved"
          :to="wikitaLiteRoute(SAVED_PAGE)"
        >
          <div
            v-if="hasSavedPages && readExploreTab.showLoadingBar('saved') && !recentlySaved.length"
            class="wikita-lite-home__loading"
          >
            <CdxProgressBar inline aria-label="Loading saved pages" />
          </div>
          <SavedModule
            :items="hasSavedPages ? recentlySaved : []"
            :preview-limit="HOME_SAVED_PREVIEW_LIMIT"
            :more-to="wikitaLiteRoute(SAVED_PAGE)"
          >
            <template
              v-if="hasSavedPages && readExploreTab.showLoadingBar('saved') && recentlySaved.length"
              #after-cards
            >
              <div class="wikita-lite-home__loading">
                <CdxProgressBar inline aria-label="Loading saved pages" />
              </div>
            </template>
          </SavedModule>
        </WikitaLiteModule>

        <WikitaLiteModule
          v-if="
            suggestionSeedsAvailable &&
            readExploreTab.showModule('furtherReading') &&
            !isDismissed('furtherReading')
          "
          module-id="furtherReading"
          :style="exploreModuleOrderStyle('furtherReading')"
          :title="MODULE_TITLES.furtherReading"
          :to="wikitaLiteRoute(FURTHER_READING_PAGE)"
        >
          <div
            v-if="
              readExploreTab.showLoadingBar('furtherReading') && !homeRelatedItems.length
            "
            class="wikita-lite-home__loading"
          >
            <CdxProgressBar inline aria-label="Loading daily reads" />
          </div>
          <RelatedModule
            v-if="homeRelatedItems.length"
            :items="homeRelatedItems"
            :loading="homeRelatedLoading"
            :preview-limit="HOME_FURTHER_READING_PREVIEW_LIMIT"
            :lists-version="listsVersion"
          >
            <template
              v-if="
                readExploreTab.showLoadingBar('furtherReading') &&
                homeRelatedItems.length
              "
              #after-cards
            >
              <div class="wikita-lite-home__loading">
                <CdxProgressBar inline aria-label="Loading daily reads" />
              </div>
            </template>
          </RelatedModule>
        </WikitaLiteModule>

        <WikitaLiteModule
          v-if="
            showSavedBasedMentions &&
            readExploreTab.showModule('mentions') &&
            !isDismissed('mentions')
          "
          module-id="mentions"
          :style="exploreModuleOrderStyle('mentions')"
          :title="MODULE_TITLES.mentions"
          :to="wikitaLiteRoute(MENTIONS_PAGE)"
        >
          <div
            v-if="readExploreTab.showLoadingBar('mentions') && !homeMentionsPreview.length"
            class="wikita-lite-home__loading"
          >
            <CdxProgressBar inline aria-label="Loading mentions" />
          </div>
          <MentionsModule
            v-if="homeMentionsPreview.length"
            :items="homeMentionsPreview"
            :preview-limit="HOME_MENTIONS_PREVIEW_LIMIT"
            :lists-version="listsVersion"
            :more-to="wikitaLiteRoute(MENTIONS_PAGE)"
          >
            <template
              v-if="readExploreTab.showLoadingBar('mentions') && homeMentionsPreview.length"
              #after-cards
            >
              <div class="wikita-lite-home__loading">
                <CdxProgressBar inline aria-label="Loading mentions" />
              </div>
            </template>
          </MentionsModule>
        </WikitaLiteModule>
      </div>
    </CdxTab>

    <CdxTab v-if="!hideTabBar" name="contribute" :label="VIEW_TAB_LABELS.contribute">
      <div class="wikita-lite-home__panel">
        <WikitaLiteModule
          v-if="contributeTab.showModule('suggestedEdits') && !isDismissed('suggestedEdits')"
          module-id="suggestedEdits"
          :style="contributeModuleOrderStyle('suggestedEdits')"
          :title="MODULE_TITLES.suggestedEdits"
          :to="wikitaLiteRoute(HELP_WANTED_PAGE)"
        >
          <div
            v-if="contributeTab.showLoadingBar('suggestedEdits') && !helpWantedPreview.length"
            class="wikita-lite-home__loading"
          >
            <CdxProgressBar inline aria-label="Loading edit suggestions" />
          </div>
          <HelpWantedModule
            v-if="helpWantedPreview.length"
            :items="helpWantedPreview"
            :preview-limit="helpWantedPreviewLimit"
            :more-to="wikitaLiteRoute(HELP_WANTED_PAGE)"
          >
            <template
              v-if="contributeTab.showLoadingBar('suggestedEdits') && helpWantedPreview.length"
              #after-cards
            >
              <div class="wikita-lite-home__loading">
                <CdxProgressBar inline aria-label="Loading edit suggestions" />
              </div>
            </template>
          </HelpWantedModule>
        </WikitaLiteModule>

        <WikitaLiteModule
          v-if="contributeTab.showModule('translation') && !isDismissed('translation')"
          module-id="translation"
          :style="contributeModuleOrderStyle('translation')"
          :title="MODULE_TITLES.translateArticles"
          :to="wikitaLiteRoute(TRANSLATIONS_PAGE)"
        >
          <div
            v-if="
              contributeTab.showLoadingBar('translation') &&
              !translationPreview.length &&
              !translationError
            "
            class="wikita-lite-home__loading"
          >
            <CdxProgressBar inline aria-label="Loading translation suggestions" />
          </div>
          <TranslationModule
            v-if="translationPreview.length || translationError"
            :items="translationSuggestions"
            :error="translationError"
            :preview-limit="HOME_TRANSLATION_PREVIEW_LIMIT"
            :more-to="wikitaLiteRoute(TRANSLATIONS_PAGE)"
            @retry="retryTranslationFeed"
          >
            <template
              v-if="
                contributeTab.showLoadingBar('translation') &&
                (translationPreview.length || translationError)
              "
              #after-cards
            >
              <div class="wikita-lite-home__loading">
                <CdxProgressBar inline aria-label="Loading translation suggestions" />
              </div>
            </template>
          </TranslationModule>
        </WikitaLiteModule>

        <WikitaLiteModule
          v-if="contributeTab.showModule('recentActivity') && !isDismissed('recentActivity')"
          module-id="recentActivity"
          :style="contributeModuleOrderStyle('recentActivity')"
          :title="recentActivityTitle"
          :to="wikitaLiteRoute(RECENT_ACTIVITY_PAGE)"
        >
          <div
            v-if="contributeTab.showLoadingBar('recentActivity') && !recentActivityPreview.length"
            class="wikita-lite-home__loading"
          >
            <CdxProgressBar inline aria-label="Loading recent activity" />
          </div>
          <RecentActivityModule
            v-if="recentActivityPreview.length"
            :items="recentActivityPreview"
            :preview-limit="recentActivityPreviewLimit"
            :more-to="wikitaLiteRoute(RECENT_ACTIVITY_PAGE)"
          >
            <template
              v-if="contributeTab.showLoadingBar('recentActivity') && recentActivityPreview.length"
              #after-cards
            >
              <div class="wikita-lite-home__loading">
                <CdxProgressBar inline aria-label="Loading recent activity" />
              </div>
            </template>
          </RecentActivityModule>
        </WikitaLiteModule>

        <WikitaLiteModule
          v-if="contributeTab.showModule('activeDiscussions') && !isDismissed('activeDiscussions')"
          module-id="activeDiscussions"
          :style="contributeModuleOrderStyle('activeDiscussions')"
          :title="MODULE_TITLES.activeDiscussions"
          :to="wikitaLiteRoute(ACTIVE_DISCUSSIONS_PAGE)"
        >
          <div
            v-if="contributeTab.showLoadingBar('activeDiscussions') && !showActiveDiscussionsContent"
            class="wikita-lite-home__loading"
          >
            <CdxProgressBar inline aria-label="Loading active discussions" />
          </div>
          <ActiveDiscussionsModule
            v-if="showActiveDiscussionsContent"
            :items="activeDiscussions"
            :error="activeDiscussionsError"
            :preview-limit="HOME_ACTIVE_DISCUSSIONS_PREVIEW_LIMIT"
            :more-to="wikitaLiteRoute(ACTIVE_DISCUSSIONS_PAGE)"
            @retry="retryActiveDiscussionsFeed"
          >
            <template
              v-if="
                contributeTab.showLoadingBar('activeDiscussions') && showActiveDiscussionsContent
              "
              #after-cards
            >
              <div class="wikita-lite-home__loading">
                <CdxProgressBar inline aria-label="Loading active discussions" />
              </div>
            </template>
          </ActiveDiscussionsModule>
        </WikitaLiteModule>

        <WikitaLiteModule
          v-if="!isDismissed('impact') && contributeTab.showModule('impact')"
          module-id="impact"
          :style="contributeModuleOrderStyle('impact')"
          :title="MODULE_TITLES.impact"
          :to="wikitaLiteRoute(IMPACT_PAGE)"
        >
          <div
            v-if="contributeTab.showLoadingBar('impact') && !impactHasContent"
            class="wikita-lite-home__loading"
          >
            <CdxProgressBar inline aria-label="Loading your impact" />
          </div>
          <ImpactModule v-if="impactHasContent" v-bind="impactCardProps" />
          <div
            v-if="contributeTab.showLoadingBar('impact') && impactHasContent"
            class="wikita-lite-home__loading"
          >
            <CdxProgressBar inline aria-label="Loading your impact" />
          </div>
        </WikitaLiteModule>

        <WikitaLiteModule
          v-if="!isDismissed('learn')"
          module-id="learn"
          :style="contributeModuleOrderStyle('learn')"
          :title="MODULE_TITLES.learn"
          :to="wikitaLiteRoute(LEARN_PAGE)"
        >
          <LearnModule />
        </WikitaLiteModule>
      </div>
    </CdxTab>
  </CdxTabs>
</template>

<style scoped>
.wikita-lite-home__tabs {
  width: 100%;
  min-width: 0;
}

.wikita-lite-home__panel {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-150, 24px);
  box-sizing: border-box;
  width: 100%;
  min-width: 0;
}

.wikita-lite-home__loading {
  padding-block: var(--spacing-50, 8px);
}
</style>
