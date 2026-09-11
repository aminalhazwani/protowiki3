<script setup lang="ts">
import { CdxToggleSwitch } from '@wikimedia/codex'

interface Props {
  label: string
  countLabel: string
  countActive?: boolean
  modelValue: boolean
}

withDefaults(defineProps<Props>(), {
  countActive: false,
})

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
}>()
</script>

<template>
  <div class="wikita-lite-personalization-toggle-row">
    <CdxToggleSwitch
      align-switch
      :model-value="modelValue"
      @update:model-value="emit('update:modelValue', $event)"
    >
      {{ label }}
      <template #description>
        <span
          class="wikita-lite-personalization-toggle-row__count"
          :class="{ 'wikita-lite-personalization-toggle-row__count--active': countActive }"
        >
          {{ countLabel }}
        </span>
      </template>
    </CdxToggleSwitch>
  </div>
</template>

<style scoped>
.wikita-lite-personalization-toggle-row {
  width: 100%;
}

.wikita-lite-personalization-toggle-row :deep(.cdx-toggle-switch) {
  width: 100%;
}

.wikita-lite-personalization-toggle-row :deep(.cdx-label__label__text) {
  font-weight: 400;
}

.wikita-lite-personalization-toggle-row__count {
  color: var(--color-subtle, #54595d);
  font-size: var(--font-size-medium, 1rem);
  line-height: var(--line-height-small, 1.375rem);
}

.wikita-lite-personalization-toggle-row__count--active {
  color: var(--color-progressive, #36c);
}
</style>
