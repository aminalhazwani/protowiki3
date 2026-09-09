import { computed, ref, watch } from 'vue'

const allSteps = ['username', 'password', 'confirmPassword', 'email']

export function useMultiStep(settings, { emailPasswordInstead } = {}) {
  const currentStepIndex = ref(0)
  const direction = ref('forward')

  const isMultiStep = computed(() => settings.value.general.multiStep)

  const activeSteps = computed(() => {
    if (!isMultiStep.value) return allSteps

    return allSteps.filter((field) => {
      if (!settings.value.fields[field]?.visible) return false
      // Keep password step (so user can toggle the checkbox), skip confirmPassword
      if (emailPasswordInstead?.value && field === 'confirmPassword') return false
      return true
    })
  })

  // Clamp index when steps are removed (field hidden, email-password toggled, etc.)
  watch(activeSteps, (steps) => {
    if (currentStepIndex.value >= steps.length) {
      currentStepIndex.value = Math.max(0, steps.length - 1)
    }
  })

  const currentField = computed(() => activeSteps.value[currentStepIndex.value])
  const isFirstStep = computed(() => currentStepIndex.value === 0)
  const isLastStep = computed(() => currentStepIndex.value === activeSteps.value.length - 1)

  function goNext() {
    if (!isLastStep.value) {
      direction.value = 'forward'
      currentStepIndex.value++
    }
  }

  function goBack() {
    if (!isFirstStep.value) {
      direction.value = 'backward'
      currentStepIndex.value--
    }
  }

  function reset() {
    currentStepIndex.value = 0
    direction.value = 'forward'
  }

  return {
    isMultiStep,
    currentStepIndex,
    activeSteps,
    currentField,
    isFirstStep,
    isLastStep,
    direction,
    goNext,
    goBack,
    reset,
  }
}
