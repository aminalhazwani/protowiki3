<script setup lang="ts">
import { computed } from 'vue'
import { CdxIcon } from '@wikimedia/codex'
import type { Icon } from '@wikimedia/codex-icons'

import {
  SUPPORTING_SIGNAL_SEPARATOR,
  visibleSupportingSignals,
  type WikitaLiteSupportingSignal,
} from '../data/supportingSignals'

/**
 * Card supporting-text row. Pass `icon` + slot content for a single signal, or
 * `signals` for several — those are bullet-joined instead of comma-joined.
 * A `timestamp` is not bulleted in: it sits at the far end of the row, and the
 * card pins the row to its bottom edge, so the time lands in the bottom corner.
 *
 * The first signal's icon stays a flex item so wrapped text hangs beside it
 * (matching the single-signal layout); any later icon sits inline in the text
 * run, because the separator's non-breaking spaces only work in text flow.
 *
 * Every text run is wrapped in an element: a bare interpolation next to a
 * newline gets a stray plain space from Vue's whitespace condensing, which
 * would show up either side of the bullet.
 */
const props = withDefaults(
  defineProps<{
    icon?: Icon
    signals?: WikitaLiteSupportingSignal[]
    timestamp?: string
  }>(),
  {
    icon: undefined,
    signals: undefined,
    timestamp: undefined,
  },
)

const shownSignals = computed(() => visibleSupportingSignals(props.signals))

const leadIcon = computed(() => shownSignals.value[0]?.icon ?? props.icon)

const shownTimestamp = computed(() => props.timestamp?.trim() ?? '')
</script>

<template>
  <div
    class="wikita-lite-supporting-row"
    :class="{ 'wikita-lite-supporting-row--timestamped': shownTimestamp }"
  >
    <CdxIcon v-if="leadIcon" :icon="leadIcon" size="small" />
    <span class="wikita-lite-supporting-row__text">
      <template v-if="shownSignals.length">
        <span
          v-for="(signal, index) in shownSignals"
          :key="index"
          class="wikita-lite-supporting-row__signal"
        >
          <span
            v-if="index > 0"
            class="wikita-lite-supporting-row__separator"
          >{{ SUPPORTING_SIGNAL_SEPARATOR }}</span>
          <CdxIcon
            v-if="index > 0 && signal.icon"
            class="wikita-lite-supporting-row__inline-icon"
            :icon="signal.icon"
            size="small"
          />
          <span class="wikita-lite-supporting-row__label">{{ signal.text }}</span>
        </span>
      </template>
      <slot v-else />
    </span>
    <span
      v-if="shownTimestamp"
      class="wikita-lite-supporting-row__timestamp"
    >{{ shownTimestamp }}</span>
  </div>
</template>
