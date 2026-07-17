import vue from 'eslint-plugin-vue'
import vueTs from '@vue/eslint-config-typescript'

export default [
  {
    ignores: [
      'node_modules/**',
      'dist/**',
      'src/typed-router.d.ts',
      'src/auto-imports.d.ts',
    ],
  },
  ...vue.configs['flat/recommended'],
  ...vueTs(),
  {
    rules: {
      'vue/multi-word-component-names': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
    },
  },
  {
    // Account-creation form ported verbatim from protowiki2 (authored in JS).
    // It keeps its plain `<script setup>` so the source stays byte-faithful and
    // isn't burdened with types the upstream component never had.
    files: [
      'src/prototypes/account-setup/components/CreateAccountForm.vue',
      'src/prototypes/account-setup/components/UsernamePolicy.vue',
    ],
    rules: {
      'vue/block-lang': 'off',
    },
  },
]
