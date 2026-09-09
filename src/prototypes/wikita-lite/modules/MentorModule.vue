<script setup lang="ts">
import { CdxCard } from '@wikimedia/codex'
import { cdxIconUserAvatar } from '@wikimedia/codex-icons'

import WikitaLiteSupportingRow from '../components/WikitaLiteSupportingRow.vue'
import { useWikitaLiteCardListClasses } from '../composables/useWikitaLiteCardListClasses'
import { LEARN_MENTOR } from '../data/learnContent'

interface Props {
  standalone?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  standalone: false,
})

const { groupClass, cardClass } = useWikitaLiteCardListClasses({ standalone: () => props.standalone })
</script>

<template>
  <div :class="['mentor-module', groupClass]">
    <CdxCard :class="['mentor-module__card', cardClass]">
      <template #title>
        {{ LEARN_MENTOR.title }}
      </template>
      <template #description>
        {{ LEARN_MENTOR.description }}
      </template>
      <template #supporting-text>
        <WikitaLiteSupportingRow :icon="cdxIconUserAvatar">
          {{ LEARN_MENTOR.supportingText }}
        </WikitaLiteSupportingRow>
      </template>
    </CdxCard>
  </div>
</template>

<style scoped>
.mentor-module {
  display: flex;
  flex-direction: column;
  width: 100%;
}

.mentor-module__card {
  width: 100%;
}
</style>
