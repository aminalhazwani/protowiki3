/**
 * The mock create-account form's rules (home2's baseline settings, copied from
 * account-creation-v3). Nothing is sent anywhere: availability is simulated and
 * every check is local.
 */

export interface AccountForm {
  username: string
  password: string
  confirmPassword: string
  email: string
}

export type AccountField = keyof AccountForm

export const ACCOUNT_FIELDS: readonly AccountField[] = [
  'username',
  'password',
  'confirmPassword',
  'email',
]

const MIN_PASSWORD_LENGTH = 8
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

/** The field's error message, or `null` when it's fine. Email is optional. */
export function accountFieldError(field: AccountField, form: AccountForm): string | null {
  const value = form[field]
  switch (field) {
    case 'username':
      return value.trim() ? null : 'Please enter a username.'
    case 'password':
      if (!value) return 'Please enter a password.'
      return value.length < MIN_PASSWORD_LENGTH
        ? `Passwords must be at least ${MIN_PASSWORD_LENGTH} characters.`
        : null
    case 'confirmPassword':
      if (!value) return 'Please confirm your password.'
      return value === form.password ? null : 'The passwords you entered do not match.'
    case 'email':
      return value && !EMAIL_PATTERN.test(value) ? 'Please enter a valid email address.' : null
  }
}

/**
 * MediaWiki-style username as the reader types: no leading underscores,
 * underscores read as spaces, first letter upper-cased. Only from the second
 * character (so a first keystroke isn't fought), unless `final` (on blur).
 */
export function capitalizeUsername(value: string, final = false): string {
  if (!final && value.length < 2) return value
  let name = value.replace(/^_+/, '').replace(/_(.)/g, ' $1')
  if (final) name = name.replace(/_+$/, '')
  return name.charAt(0).toUpperCase() + name.slice(1)
}
