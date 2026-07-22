<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { CdxButton, CdxIcon } from '@wikimedia/codex'
import { cdxIconArrowNext, cdxIconUserMentor } from '@wikimedia/codex-icons'

import ChromeWrapper from '@/components/chrome/ChromeWrapper.vue'
import PageTabs from '@/components/PageTabs.vue'

import SuggestedEditsModule from '../components/SuggestedEditsModule.vue'
import { useSuggestions } from '../data/useSuggestions'
import { useSuggestionFilters } from '../data/useSuggestionFilters'
import { useBrandTo } from '../data/useBrandTo'
import type { FlowState } from '../data/useFlowState'

const props = defineProps<{ flow: FlowState }>()

const brandTo = useBrandTo()

const greeting = computed(() => {
  const name = props.flow.username.value
  return name ? `Hello, ${name}!` : 'Hello!'
})

const homeTabs = [
  { id: 'homepage', label: 'Homepage', active: true },
  { id: 'userpage', label: 'User page' },
  { id: 'talk', label: 'Talk' },
]
const { suggestions, loading, error } = useSuggestions()
const { isEnabled } = useSuggestionFilters()

// Only count/preview suggestions whose edit type is enabled, so the "1 of N"
// counter matches the carousel and reflects the (easy-by-default) filter.
const visibleSuggestions = computed(() =>
  suggestions.value.filter((suggestion) => isEnabled(suggestion.taskHeading)),
)
const count = computed(() => visibleSuggestions.value.length)

function scrollToTop() {
  window.scrollTo({ top: 0, left: 0, behavior: 'instant' })
}

function onSearch(): void {
  props.flow.goTo('search')
}

function onGoHome(): void {
  // Already on the home screen — the account menu's username item just returns
  // the user to the top rather than triggering a redundant same-route navigation.
  scrollToTop()
}

onMounted(scrollToTop)
</script>

<template>
  <ChromeWrapper
    skin="mobile"
    :last-edited-notice="false"
    :brand-to="brandTo"
    :username="flow.username.value || undefined"
    @search="onSearch"
    @go-home="onGoHome"
  >
    <div class="home">
      <header class="home__masthead">
        <h1 class="home__greeting">{{ greeting }}</h1>
        <PageTabs :tabs="homeTabs" aria-label="Homepage sections" />
      </header>

      <SuggestedEditsModule
        :suggestions="visibleSuggestions"
        :loading="loading"
        :error="error"
        :count="count"
        @open-all="props.flow.goTo('all')"
      />

      <section class="home__module home__module--impact">
        <div class="home__impact-preview">
          <header class="home__module-head">
            <h2 class="home__module-title">Your impact</h2>
            <CdxButton
              weight="quiet"
              :icon-only="true"
              aria-label="View your impact"
              tabindex="-1"
            >
              <CdxIcon :icon="cdxIconArrowNext" />
            </CdxButton>
          </header>

          <div class="home__impact-hero">
            <img
              class="home__impact-image"
              src="https://en.wikipedia.org/w/extensions/GrowthExperiments/images/intro-heart-article.png?269e6"
              alt=""
            />
            <div class="home__impact-text">
              <p class="home__impact-heading">0 edits to articles so far</p>
              <p class="home__impact-body">
                Help extend free knowledge to the world by editing topics that matter most to you.
              </p>
            </div>
          </div>
        </div>

        <p class="home__impact-footer">
          Start with a few <strong>suggested edits</strong>, then see how many people are viewing
          your contributions here.
        </p>
      </section>

      <section class="home__module">
        <header class="home__module-head">
          <h2 class="home__module-title">Your mentor</h2>
          <CdxButton
            weight="quiet"
            :icon-only="true"
            aria-label="View your mentor"
            tabindex="-1"
          >
            <CdxIcon :icon="cdxIconArrowNext" />
          </CdxButton>
        </header>
        <p class="home__mentor-intro">
          We've assigned you an experienced editor to answer your questions about editing.
        </p>
        <div class="home__mentor-block">
          <div class="home__mentor-user">
            <CdxIcon :icon="cdxIconUserMentor" class="home__mentor-avatar" />
            <span class="home__mentor-name">ARoseWolf</span>
          </div>
          <p class="home__mentor-meta">Active 497 days ago</p>
        </div>
      </section>

      <section class="home__module">
        <header class="home__module-head">
          <h2 class="home__module-title">Get help with editing</h2>
        </header>
        <p class="home__help-summary">Ask the help desk or read help pages.</p>
      </section>
    </div>
  </ChromeWrapper>
</template>

<style scoped>
.home {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-100, 16px);
  padding: var(--spacing-100, 16px);
}

.home__masthead {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-50, 8px);
}

.home__greeting {
  margin: 0;
  font-family: var(--font-family-serif);
  font-size: var(--font-size-xxx-large, 2rem);
  font-weight: var(--font-weight-normal, 400);
  line-height: var(--line-height-xxx-large, 1.375);
  color: var(--color-base);
}

.home__module {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-100, 16px);
  border: var(--border-width-base, 1px) solid var(--border-color-subtle, #c8ccd1);
  border-radius: var(--border-radius-base, 2px);
  padding: var(--spacing-100, 16px);
}

.home__module-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-height: 2rem;
}

.home__module-title {
  margin: 0;
  font-family:
    var(--font-family-system-sans, system-ui, sans-serif), var(--font-family-base, sans-serif);
  font-size: var(--font-size-large, 1.125rem);
  font-weight: var(--font-weight-bold);
  line-height: var(--line-height-large, 1.56);
  color: var(--color-base);
}

.home__module--impact {
  gap: 0;
  padding: 0;
  overflow: hidden;
}

.home__impact-preview {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-100, 16px);
  padding: var(--spacing-100, 16px);
  background-color: var(--background-color-interactive-subtle, #f8f9fa);
}

.home__impact-hero {
  display: flex;
  align-items: center;
  gap: var(--spacing-100, 16px);
}

.home__impact-image {
  flex-shrink: 0;
  width: 72px;
  height: auto;
}

.home__impact-text {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-25, 4px);
  min-width: 0;
}

.home__impact-heading {
  margin: 0;
  font-size: var(--font-size-medium, 1rem);
  font-weight: var(--font-weight-bold);
  line-height: var(--line-height-small, 1.375);
  color: var(--color-base);
}

.home__impact-body {
  margin: 0;
  font-size: var(--font-size-medium, 1rem);
  line-height: var(--line-height-medium, 1.625);
  color: var(--color-base);
}

.home__impact-footer {
  margin: 0;
  padding: var(--spacing-100, 16px);
  font-size: var(--font-size-small, 0.875rem);
  line-height: var(--line-height-small, 1.375);
  color: var(--color-subtle, #54595d);
}

.home__mentor-intro {
  margin: 0;
  font-size: var(--font-size-medium, 1rem);
  line-height: var(--line-height-medium, 1.625);
  color: var(--color-base);
}

.home__mentor-block {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-50, 8px);
}

.home__mentor-user {
  display: flex;
  align-items: center;
  gap: var(--spacing-75, 12px);
}

.home__mentor-avatar {
  flex-shrink: 0;
  width: 2.5rem;
  height: 2.5rem;
  color: var(--color-base--subtle, #54595d);
}

.home__mentor-name {
  font-size: var(--font-size-medium, 1rem);
  line-height: var(--line-height-small, 1.375);
  color: var(--color-base);
}

.home__mentor-meta {
  margin: 0;
  font-size: var(--font-size-small, 0.875rem);
  line-height: var(--line-height-small, 1.375);
  color: var(--color-subtle, #54595d);
}

.home__help-summary {
  margin: 0;
  font-size: var(--font-size-medium, 1rem);
  line-height: var(--line-height-medium, 1.625);
  color: var(--color-subtle, #54595d);
}
</style>
