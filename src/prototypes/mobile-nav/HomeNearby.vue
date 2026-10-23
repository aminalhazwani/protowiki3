<script setup lang="ts">
/**
 * The prototype's Special:Nearby, after the NearbyPages extension (its copy and
 * illustration): "Show nearby pages" asks the browser for the reader's location,
 * then lists the articles around them, nearest first. The real page renders all
 * of this client-side, so only the data (geosearch) and the image come remotely.
 */
import { onBeforeUnmount, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { CdxButton, CdxCard, CdxIcon, CdxMessage, CdxProgressBar } from '@wikimedia/codex'
import { cdxIconMapPin } from '@wikimedia/codex-icons'

import { useConfig } from '@/composables/useConfig'

import { fetchNearby, formatDistance, nearbyIllustrationUrl, type NearbyArticle } from './data/fetchNearby'
import HomePage from './HomePage.vue'
import { homeArticleLocation } from './routes'
import { tabBarInset } from './useHomeTabBar'

type Status = 'intro' | 'locating' | 'results' | 'empty' | 'denied' | 'unavailable' | 'unsupported' | 'error'

// Module-level: coming back to Nearby shows the last list rather than the intro.
const lastResults = ref<NearbyArticle[] | null>(null)

const router = useRouter()
const { lang } = useConfig()

const status = ref<Status>(lastResults.value ? 'results' : 'intro')
let controller: AbortController | undefined

function locate(): Promise<GeolocationPosition> {
  return new Promise((resolve, reject) =>
    navigator.geolocation.getCurrentPosition(resolve, reject, {
      enableHighAccuracy: false,
      timeout: 15000,
      maximumAge: 60000,
    }),
  )
}

/** Ask for the location (the browser prompts the first time), then load what's around it. */
async function showNearby(): Promise<void> {
  if (!('geolocation' in navigator)) {
    status.value = 'unsupported'
    return
  }
  status.value = 'locating'
  let position: GeolocationPosition
  try {
    position = await locate()
  } catch (error) {
    const denied = (error as GeolocationPositionError).code === 1
    status.value = denied ? 'denied' : 'unavailable'
    return
  }
  controller?.abort()
  controller = new AbortController()
  try {
    const results = await fetchNearby(position.coords.latitude, position.coords.longitude, {
      lang: lang.value,
      signal: controller.signal,
    })
    lastResults.value = results
    status.value = results.length ? 'results' : 'empty'
  } catch {
    if (!controller.signal.aborted) status.value = 'error'
  }
}

// Already allowed: skip the intro, as NearbyPages does on a return visit.
onMounted(async () => {
  if (lastResults.value || !navigator.permissions) return
  try {
    const permission = await navigator.permissions.query({ name: 'geolocation' })
    if (permission.state === 'granted' && status.value === 'intro') void showNearby()
  } catch {
    // Permissions API without geolocation support: keep the intro.
  }
})

onBeforeUnmount(() => controller?.abort())

function articleHref(title: string): string {
  return router.resolve(homeArticleLocation(title)).href
}

/** Cards open in the prototype; modified clicks still open a new tab. */
function onCardClick(event: MouseEvent, title: string): void {
  if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return
  event.preventDefault()
  void router.push(homeArticleLocation(title))
}
</script>

<template>
  <HomePage title="Nearby" class="home-nearby">
    <CdxProgressBar v-if="status === 'locating'" aria-label="Finding pages near you" />

    <div v-else-if="status === 'intro'" class="home-nearby__intro">
      <img class="home-nearby__image" :src="nearbyIllustrationUrl(lang)" alt="" />
      <p class="home-nearby__heading">Places around you</p>
      <p class="home-nearby__description">
        You can read interesting Wikipedia pages about places around you
      </p>
      <CdxButton action="progressive" @click="showNearby">Show nearby pages</CdxButton>
    </div>

    <template v-else-if="status === 'results' && lastResults">
      <ul class="home-nearby__list">
        <li v-for="article in lastResults" :key="article.title">
          <CdxCard
            :url="articleHref(article.title)"
            :thumbnail="article.thumbnailUrl ? { url: article.thumbnailUrl } : null"
            force-thumbnail
            @click="onCardClick($event, article.title)"
          >
            <template #title>{{ article.title }}</template>
            <template v-if="article.description" #description>
              {{ article.description }}
            </template>
            <template #supporting-text>
              <span class="home-nearby__distance">
                <CdxIcon :icon="cdxIconMapPin" size="small" />
                {{ formatDistance(article.distance) }}
              </span>
            </template>
          </CdxCard>
        </li>
      </ul>
      <!-- Refresh rides above the tab bar while it's in view. -->
      <div class="home-nearby__refresh" :style="{ bottom: `${tabBarInset}px` }">
        <CdxButton action="progressive" @click="showNearby">Show nearby pages</CdxButton>
      </div>
    </template>

    <div v-else class="home-nearby__message">
      <CdxMessage :type="status === 'empty' ? 'notice' : 'error'">
        <template v-if="status === 'denied'">
          You have denied access to Location Services for Wikipedia. To change this please
          visit your browser or device settings
        </template>
        <template v-else-if="status === 'unavailable'">
          Wikipedia cannot determine your location. Please try again with a better signal.
        </template>
        <template v-else-if="status === 'unsupported'">
          Sorry! Your web browser doesn't support Wikipedia Nearby.
        </template>
        <template v-else-if="status === 'empty'">
          Quiet out here... There weren't any pages found with nearby topics.
        </template>
        <template v-else>Wikipedia Nearby is having some issues. Try refreshing your location.</template>
      </CdxMessage>
      <CdxButton v-if="status !== 'unsupported'" action="progressive" @click="showNearby">
        Show nearby pages
      </CdxButton>
    </div>
  </HomePage>
</template>

<style scoped>
.home-nearby__intro {
  display: flex;
  flex-direction: column;
  align-items: center;
  max-width: 400px;
  margin: var(--spacing-100) auto 0;
  text-align: center;
}

.home-nearby__image {
  width: 180px;
  height: auto;
  margin-bottom: var(--spacing-150);
}

.home-nearby__heading {
  margin: 0;
  font-size: var(--font-size-medium);
  font-weight: var(--font-weight-bold);
  line-height: var(--line-height-medium);
}

.home-nearby__description {
  margin: var(--spacing-25) 0 var(--spacing-150);
  color: var(--color-subtle);
  font-size: var(--font-size-medium);
  line-height: var(--line-height-medium);
}

.home-nearby__list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-75);
  margin: 0;
  padding: 0;
  list-style: none;
}

.home-nearby__list li {
  margin: 0;
}

.home-nearby__distance {
  display: inline-flex;
  align-items: center;
  gap: var(--spacing-25);
  color: var(--color-progressive);
}

.home-nearby__distance .cdx-icon {
  color: var(--color-subtle);
}

.home-nearby__refresh {
  position: sticky;
  z-index: var(--z-index-sticky);
  display: flex;
  justify-content: center;
  margin-inline: calc(-1 * var(--home-gutter, 0px));
  margin-top: var(--spacing-75);
  padding: var(--spacing-75) var(--home-gutter, 0px);
  border-top: var(--border-width-base) solid var(--border-color-subtle);
  background-color: var(--background-color-base);
  transition: bottom var(--transition-duration-medium) var(--transition-timing-function-system);
}

@media (prefers-reduced-motion: reduce) {
  .home-nearby__refresh {
    transition: none;
  }
}

.home-nearby__message {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: var(--spacing-100);
}
</style>
