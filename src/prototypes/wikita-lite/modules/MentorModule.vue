<script setup lang="ts">
import { CdxButton, CdxMessage } from '@wikimedia/codex'

import { useWikitaLiteMentor } from '../composables/useWikitaLiteMentor'
import { MENTOR_ASSIGNED, MENTOR_UNASSIGNED } from '../data/mentorContent'

interface Props {
  standalone?: boolean
}

withDefaults(defineProps<Props>(), {
  standalone: false,
})

const { isAssigned, bannerDismissed, assignMentor, dismissBanner } = useWikitaLiteMentor()
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

      <div class="mentor-module__profile">
        <div class="mentor-module__avatar" aria-hidden="true">
          {{ MENTOR_ASSIGNED.profile.initial }}
        </div>
        <div class="mentor-module__profile-content">
          <p class="mentor-module__name">
            {{ MENTOR_ASSIGNED.profile.name }}
          </p>
          <blockquote class="mentor-module__bio">
            {{ MENTOR_ASSIGNED.profile.bio }}
          </blockquote>
          <p class="mentor-module__meta">
            {{ MENTOR_ASSIGNED.profile.editingSince }}
          </p>
        </div>
      </div>

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

.mentor-module__profile {
  display: flex;
  gap: var(--spacing-75, 12px);
  align-items: flex-start;
  box-sizing: border-box;
  width: 100%;
  padding: var(--spacing-75, 12px);
  background-color: var(--background-color-base, #fff);
  border: 1px solid var(--border-color-base, #a2a9b1);
  border-radius: var(--border-radius-base, 2px);
}

.mentor-module__avatar {
  display: flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  font-size: var(--font-size-large, 1rem);
  font-weight: var(--font-weight-bold, 700);
  line-height: var(--line-height-large, 1.625rem);
  color: var(--color-inverted, #fff);
  background-color: var(--background-color-inverted, #101418);
  border-radius: var(--border-radius-circle, 9999px);
}

.mentor-module__profile-content {
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: var(--spacing-25, 4px);
  min-width: 0;
}

.mentor-module__name {
  margin: 0;
  font-size: var(--font-size-medium, 0.875rem);
  font-weight: var(--font-weight-bold, 700);
  line-height: var(--line-height-small, 1.25rem);
  color: var(--color-base, #202122);
}

.mentor-module__bio {
  margin: 0;
  font-family: var(--font-family-serif, 'Linux Libertine', Georgia, Times, serif);
  font-size: var(--font-size-medium, 0.875rem);
  font-weight: var(--font-weight-normal, 400);
  line-height: var(--line-height-medium, 1.375rem);
  color: var(--color-base, #202122);
}

.mentor-module__meta {
  margin: 0;
  padding-top: var(--spacing-25, 4px);
  font-size: var(--font-size-small, 0.8125rem);
  line-height: var(--line-height-small, 1.25rem);
  color: var(--color-subtle, #54595d);
}

.mentor-module__cta {
  width: 100%;
}
</style>
