/**
 * Static configuration for the create-account form.
 *
 * Ported from account-creation-v3-alt's admin panel defaults (variant `v2`,
 * i.e. the "no URL params" baseline). The admin panel and its URL-param syncing
 * are intentionally left behind — this object is the single, fixed source of
 * truth for field visibility and behaviors.
 */
export const baseSettings = {
  general: {
    multiStep: false,
  },
  hcaptcha: {
    position: 'below', // 'above' or 'below' the CTA button
  },
  inputHeight: {
    size: '32', // '32', '36', or '40' pixels
  },
  fields: {
    username: {
      visible: true,
      behaviors: {
        validateWhileTyping: true, // "Run validation while typing"
        taken: false, // "Any username triggers a taken username error"
        autoFocus: true, // "Focus username field on page load"
        autoCapitalize: true, // "Capitalize first letter as user types"
        learnMoreLink: false, // "Show 'Learn more' link instead of policy popover"
        chooseCarefullyCopy: true, // "'Choose carefully' description copy"
        thingsToKnowCopy: false, // "'Things to know' description copy"
        showUsernameHelperText: false, // "Show username suggestion below field"
        showUsernameHelperTextChip: false, // "Show username suggestion as info chip"
        showUsernameHelperTextChips: false, // "Show three username suggestions as chips"
        advanceFocusOnSuggestion: false, // "Move focus to password field after selecting suggestion"
        validationSwapsHelpText: false, // "Validation result replaces help text in place"
        showReloadUsername: false, // "Show reload username button"
        prefillUsername: false, // "Pre-fill username field with a generated username"
      },
    },
    password: {
      visible: true,
      behaviors: {
        enforceLength: true, // "Enforce password length requirement" (default on)
        weak: false, // "Any password triggers a weak password warning"
        showToggle: true, // "Display show password button"
        emailPassword: false, // "Show email me a password option"
        hideHelperText: true, // "Hide helper text"
      },
    },
    confirmPassword: {
      visible: true,
      behaviors: {
        matchValidation: true, // "Password match validation" (default on)
        showToggle: true, // "Display show password button"
      },
    },
    email: {
      visible: true,
      behaviors: {
        emailValidation: true, // "Email validation" (default on)
        hideDescription: true, // "Hide description text"
        hideOptionalFlag: true, // "Hide (recommended) flag"
      },
    },
  },
}
