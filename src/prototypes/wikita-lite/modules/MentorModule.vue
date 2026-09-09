<script setup lang="ts">
import { CdxButton, CdxCard, CdxMessage } from '@wikimedia/codex'

import { useWikitaLiteCardListClasses } from '../composables/useWikitaLiteCardListClasses'
import { useWikitaLiteMentor } from '../composables/useWikitaLiteMentor'
import { MENTOR_ASSIGNED, MENTOR_UNASSIGNED } from '../data/mentorContent'

interface Props {
  standalone?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  standalone: false,
})

const { isAssigned, bannerDismissed, assignMentor, dismissBanner } = useWikitaLiteMentor()
const { cardClass } = useWikitaLiteCardListClasses({ standalone: () => props.standalone })

function mentorAvatarThumbnail(initial: string) {
  const letter = initial.slice(0, 1)
  const svg = [
    '<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 48 48" aria-hidden="true">',
    '<circle cx="24" cy="24" r="24" fill="#101418"/>',
    '<text x="24" y="24" dy="0.35em" text-anchor="middle" fill="#fff" font-family="sans-serif" font-size="20" font-weight="700">',
    letter,
    '</text></svg>',
  ].join('')

  return { url: `data:image/svg+xml,${encodeURIComponent(svg)}` }
}
</script>

<template>
  <div class="mentor-module">
    <template v-if="!isAssigned">
      <p class="mentor-module__description">
        {{ MENTOR_UNASSIGNED.description }}
      </p>
      <CdxButton class="mentor-module__cta" weight="normal" @click="assignMentor">
        {{ MENTOR_UNASSIGNED.cta }}
      </CdxButton>
    </template>

    <template v-else>
      <CdxMessage
        v-if="!bannerDismissed"
        type="notice"
        :allow-user-dismiss="true"
        @user-dismissed="dismissBanner"
      >
        {{ MENTOR_ASSIGNED.assignmentNotice }}
      </CdxMessage>

      <CdxCard
        :class="['mentor-module__card', cardClass]"
        :thumbnail="mentorAvatarThumbnail(MENTOR_ASSIGNED.profile.initial)"
      >
        <template #title>
          {{ MENTOR_ASSIGNED.profile.name }}
        </template>
        <template #description>
          {{ MENTOR_ASSIGNED.profile.bio }}
        </template>
        <template #supporting-text>
          {{ MENTOR_ASSIGNED.profile.editingSince }}
        </template>
      </CdxCard>

      <CdxButton class="mentor-module__cta" weight="normal">
        {{ MENTOR_ASSIGNED.cta }}
      </CdxButton>
    </template>
  </div>
</template>

<style scoped>
.mentor-module {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-75, 12px);
  width: 100%;
}

.mentor-module__description {
  margin: 0;
  font-size: var(--font-size-medium, 0.875rem);
  line-height: var(--line-height-medium, 1.375rem);
  color: var(--color-subtle, #54595d);
}

.mentor-module__card {
  width: 100%;
}

.mentor-module__card :deep(.cdx-thumbnail__image) {
  border: 0;
  border-radius: var(--border-radius-circle, 9999px);
}

.mentor-module__card :deep(.cdx-card__text__description) {
  font-family: var(--font-family-serif);
  font-size: var(--font-size-medium);
  font-weight: var(--font-weight-normal);
  line-height: var(--line-height-medium);
  color: var(--color-base);
}

.mentor-module__cta {
  width: 100%;
}
</style>
