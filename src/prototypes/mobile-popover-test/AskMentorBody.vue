<script setup lang="ts">
/**
 * Shared body for the three "ask your mentor" overlays (popover, dialog,
 * full-screen dialog) so all three render identical content. Title and the
 * Publish action come from the host overlay's own `title` / `primaryAction`.
 */
import { CdxField, CdxTextArea } from '@wikimedia/codex'

/** Same canonical URLs the site footer uses (see `ChromeFooter.vue`). */
const TERMS_OF_USE_URL =
  'https://foundation.wikimedia.org/wiki/Special:MyLanguage/Policy:Terms_of_Use'
const CC_BY_SA_URL = 'https://creativecommons.org/licenses/by-sa/4.0/'
const GFDL_URL = 'https://www.gnu.org/licenses/fdl-1.3.html'

interface Props {
  /** Username the question gets published under. */
  displayName: string
  /** Mentor talk page — where an asked question gets published. */
  talkPageHref?: string
}

withDefaults(defineProps<Props>(), {
  talkPageHref: '#',
})

const draft = defineModel<string>({ default: '' })
</script>

<template>
  <!-- click.stop: a click inside must not reach the overlay's dismiss handler. -->
  <div class="mentor-ask" @click.stop>
    <p class="mentor-ask__intro">
      When you ask a question, it gets <strong>published publicly</strong> under your username, "{{
        displayName
      }}", to <a :href="talkPageHref" class="mentor-ask__link">your mentor's talk page</a>, which is
      where they can find and respond to your question.
    </p>

    <CdxField>
      <template #label>Your question</template>

      <CdxTextArea
        v-model="draft"
        autosize
        placeholder="Say hello and ask your question. E.g. How do I create a citation?"
      />

      <template #help-text>
        By publishing changes, you agree to the
        <a :href="TERMS_OF_USE_URL" class="mentor-ask__link" rel="noopener noreferrer"
          >Terms of Use</a
        >, and you irrevocably agree to release your contribution under the
        <a :href="CC_BY_SA_URL" class="mentor-ask__link" rel="noopener noreferrer"
          >CC BY-SA 4.0 License</a
        >
        and the
        <a :href="GFDL_URL" class="mentor-ask__link" rel="noopener noreferrer">GFDL</a>. You agree
        that a hyperlink or URL is sufficient attribution under the Creative Commons license.
      </template>
    </CdxField>
  </div>
</template>

<style scoped>
.mentor-ask__intro {
  margin: 0 0 var(--spacing-100, 16px);
  font-size: var(--font-size-medium);
  line-height: var(--line-height-medium);
  color: var(--color-base, #202122);
}

.mentor-ask__link {
  color: var(--color-progressive, #36c);
  text-decoration: none;
}

.mentor-ask__link:hover {
  text-decoration: underline;
}
</style>
