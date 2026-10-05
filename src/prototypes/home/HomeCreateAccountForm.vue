<script setup lang="ts">
/**
 * The mock create-account form (home2's baseline, from account-creation-v3):
 * username with a simulated availability check, password + confirmation with
 * a show toggle, optional email. Nothing leaves the page; `submit` hands the
 * username on once every field passes (`data/accountForm.ts`).
 */
import { onBeforeUnmount, onMounted, reactive, ref } from 'vue'
import { CdxButton, CdxField, CdxIcon, CdxProgressIndicator, CdxTextInput } from '@wikimedia/codex'
import type { ValidationMessages, ValidationStatusType } from '@wikimedia/codex'
import { cdxIconEye, cdxIconEyeClosed, cdxIconHelpNotice } from '@wikimedia/codex-icons'

import {
  ACCOUNT_FIELDS,
  accountFieldError,
  capitalizeUsername,
  type AccountField,
  type AccountForm,
} from './data/accountForm'
import HomeUsernamePolicy from './HomeUsernamePolicy.vue'

const emit = defineEmits<{ submit: [username: string] }>()

/** After a pause in typing, the spinner shows; after a longer one, the check "returns" (home2). */
const SPINNER_DELAY_MS = 250
const CHECK_DELAY_MS = 2000

const form = reactive<AccountForm>({ username: '', password: '', confirmPassword: '', email: '' })
const errors = reactive<Record<AccountField, string | null>>({
  username: null,
  password: null,
  confirmPassword: null,
  email: null,
})
const availability = ref<'idle' | 'checking' | 'available'>('idle')
const visible = reactive({ password: false, confirmPassword: false })
const policyOpen = ref(false)
const policyButton = ref<InstanceType<typeof CdxButton> | null>(null)
const formEl = ref<HTMLFormElement | null>(null)

/** No autofill, autocorrect or autocapitalize: the form manages the username's case itself. */
const PLAIN_INPUT = {
  autocomplete: 'off',
  autocorrect: 'off',
  autocapitalize: 'off',
  spellcheck: false,
}

function status(field: AccountField): ValidationStatusType {
  if (errors[field]) return 'error'
  return field === 'username' && availability.value === 'available' ? 'success' : 'default'
}

function messages(field: AccountField): ValidationMessages {
  if (errors[field]) return { error: errors[field]! }
  return field === 'username' && availability.value === 'available'
    ? { success: 'Username available' }
    : {}
}

/** On blur an empty field stays quiet; on submit it's an error. */
function check(field: AccountField, { submit = false } = {}): boolean {
  errors[field] = !submit && !form[field] ? null : accountFieldError(field, form)
  return !errors[field]
}

let spinnerTimer: ReturnType<typeof setTimeout> | undefined
let checkTimer: ReturnType<typeof setTimeout> | undefined

function clearTimers(): void {
  clearTimeout(spinnerTimer)
  clearTimeout(checkTimer)
}

function checkUsername(): void {
  clearTimers()
  availability.value = check('username') && form.username.trim() ? 'available' : 'idle'
}

function onUsernameInput(value: string | number): void {
  form.username = capitalizeUsername(String(value))
  clearTimers()
  errors.username = null
  availability.value = 'idle'
  if (!form.username.trim()) return
  spinnerTimer = setTimeout(() => (availability.value = 'checking'), SPINNER_DELAY_MS)
  checkTimer = setTimeout(checkUsername, CHECK_DELAY_MS)
}

function onUsernameBlur(): void {
  form.username = capitalizeUsername(form.username, true)
  checkUsername()
}

function onSubmit(): void {
  clearTimers()
  const valid = ACCOUNT_FIELDS.map((field) => check(field, { submit: true }))
  const firstInvalid = ACCOUNT_FIELDS[valid.indexOf(false)]
  if (firstInvalid) {
    availability.value = 'idle'
    formEl.value?.querySelector<HTMLInputElement>(`[data-field="${firstInvalid}"] input`)?.focus()
    return
  }
  emit('submit', form.username.trim())
}

/*
 * CODEX+ CdxTextInput: no end action. The end icon doubles as the show-password
 * toggle (home2), so it's given a button's role, focus and name here, and
 * clicks / Enter / Space on it are picked up by the wrapper.
 */
function onEyeEvent(
  event: MouseEvent | KeyboardEvent,
  field: 'password' | 'confirmPassword',
): void {
  const icon = (event.target as Element).closest('.cdx-text-input__end-icon')
  if (!icon) return
  if (event instanceof KeyboardEvent) {
    if (event.key !== 'Enter' && event.key !== ' ') return
    event.preventDefault()
  }
  visible[field] = !visible[field]
  icon.setAttribute('aria-label', visible[field] ? 'Hide password' : 'Show password')
}

onMounted(() => {
  formEl.value?.querySelectorAll('.cdx-text-input__end-icon').forEach((icon) => {
    icon.setAttribute('role', 'button')
    icon.setAttribute('tabindex', '0')
    icon.setAttribute('aria-label', 'Show password')
  })
})

onBeforeUnmount(clearTimers)
</script>

<template>
  <form ref="formEl" class="home-create-account-form" novalidate @submit.prevent="onSubmit">
    <CdxField data-field="username" :status="status('username')" :messages="messages('username')">
      <template #label>Username</template>
      <template #description>
        <span class="home-create-account-form__description">
          Avoid using your real name.
          <CdxButton
            ref="policyButton"
            type="button"
            weight="quiet"
            size="small"
            aria-label="Username policy"
            @click="policyOpen = true"
          >
            <CdxIcon :icon="cdxIconHelpNotice" size="small" />
          </CdxButton>
        </span>
      </template>
      <CdxTextInput
        v-bind="PLAIN_INPUT"
        :model-value="form.username"
        placeholder="Enter your username"
        @update:model-value="onUsernameInput"
        @blur="onUsernameBlur"
      />
      <template v-if="availability === 'checking'" #help-text>
        <CdxProgressIndicator show-label>Checking availability</CdxProgressIndicator>
      </template>
    </CdxField>

    <CdxField data-field="password" :status="status('password')" :messages="messages('password')">
      <template #label>Password</template>
      <span @click="onEyeEvent($event, 'password')" @keydown="onEyeEvent($event, 'password')">
        <CdxTextInput
          v-model="form.password"
          v-bind="PLAIN_INPUT"
          :input-type="visible.password ? 'text' : 'password'"
          :end-icon="visible.password ? cdxIconEyeClosed : cdxIconEye"
          placeholder="Enter a password"
          @blur="check('password')"
        />
      </span>
    </CdxField>

    <CdxField
      data-field="confirmPassword"
      :status="status('confirmPassword')"
      :messages="messages('confirmPassword')"
    >
      <template #label>Confirm password</template>
      <span
        @click="onEyeEvent($event, 'confirmPassword')"
        @keydown="onEyeEvent($event, 'confirmPassword')"
      >
        <CdxTextInput
          v-model="form.confirmPassword"
          v-bind="PLAIN_INPUT"
          :input-type="visible.confirmPassword ? 'text' : 'password'"
          :end-icon="visible.confirmPassword ? cdxIconEyeClosed : cdxIconEye"
          placeholder="Enter password again"
          @blur="check('confirmPassword')"
        />
      </span>
    </CdxField>

    <CdxField data-field="email" optional :status="status('email')" :messages="messages('email')">
      <template #label>Email address</template>
      <CdxTextInput
        v-model="form.email"
        v-bind="PLAIN_INPUT"
        input-type="email"
        placeholder="Enter your email address"
        @blur="check('email')"
      />
    </CdxField>

    <CdxButton
      class="home-create-account-form__submit"
      type="submit"
      action="progressive"
      weight="primary"
      size="large"
    >
      Create your account
    </CdxButton>

    <p class="home-create-account-form__captcha">
      This site is protected by hCaptcha and its
      <a href="https://www.hcaptcha.com/privacy" target="_blank" rel="noopener">Privacy Policy</a>
      and
      <a href="https://www.hcaptcha.com/terms" target="_blank" rel="noopener">Terms of Service</a>
      apply.
    </p>

    <HomeUsernamePolicy v-model:open="policyOpen" :anchor="policyButton?.$el ?? null" />
  </form>
</template>

<style scoped>
.home-create-account-form {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-150);
}

/* Codex fields bring their own top margin when stacked; the flex gap spaces them instead. */
.home-create-account-form :deep(.cdx-field) {
  margin-top: 0;
}

.home-create-account-form__description {
  display: inline-flex;
  align-items: center;
  gap: var(--spacing-25);
}

/* The end icon is the show-password toggle (see `onEyeEvent`). */
.home-create-account-form :deep(.cdx-text-input__end-icon) {
  cursor: pointer;
}

/* The form's whole width (Codex caps buttons at 28rem). */
.home-create-account-form__submit {
  width: 100%;
  max-width: none;
}

.home-create-account-form__captcha {
  margin: calc(-1 * var(--spacing-50)) 0 0;
  font-size: var(--font-size-small);
  line-height: var(--line-height-x-small);
  color: var(--color-subtle);
}

.home-create-account-form__captcha a {
  color: var(--color-subtle);
  text-decoration: underline;
}
</style>
