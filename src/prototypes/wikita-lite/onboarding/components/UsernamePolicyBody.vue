<template>
  <div class="policy-body">
    <ul class="policy-list">
      <li>Consider <b>privacy risks</b> before using your real name.</li>
      <li>Don't use offensive, misleading, or promotional names.</li>
      <li>Your username must represent you as an individual, not an organization.</li>
    </ul>
    <a
      href="https://en.wikipedia.org/wiki/Wikipedia:Username_policy"
      target="_blank"
      rel="noopener"
      class="policy-full-link"
    >Read the full username policy</a>
  </div>
</template>

<script setup lang="ts">
/**
 * The policy copy itself — shared by the two shells `UsernamePolicy` picks
 * between (Minerva bottom sheet, Vector popover) so the wording can't drift
 * between skins.
 */
</script>

<style scoped>
/*
 * Sets the popover's width, since `CdxPopover` sizes to its content (up to the
 * Codex 512px cap, which floating-ui writes inline — a stylesheet rule on the
 * popover itself can't reach it). Keeps the popover from outrunning the 448px
 * form it explains. On the phone sheet the column is narrower, so it's inert.
 */
.policy-body {
  max-width: 400px;
}

.policy-list {
  margin: 0;
  padding-left: var(--spacing-200);
  line-height: var(--line-height-medium);
  color: var(--color-base);
}

.policy-list li {
  margin-bottom: var(--spacing-25);
}

.policy-list li:last-child {
  margin-bottom: 0;
}

.policy-full-link {
  display: block;
  margin-top: var(--spacing-100);
  color: var(--color-progressive);
}
</style>
