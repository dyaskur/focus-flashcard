import js from '@eslint/js';
import ts from 'typescript-eslint';
import svelte from 'eslint-plugin-svelte';
export default ts.config(
  {
    ignores: [
      '.svelte-kit/**',
      'node_modules/**',
      'build/**',
      '.amp/**',
      'drizzle/**',
      'playwright-report/**',
      'test-results/**'
    ]
  },
  js.configs.recommended,
  ...ts.configs.recommended,
  ...svelte.configs['flat/recommended'],
  {
    languageOptions: {
      globals: {
        process: 'readonly',
        Buffer: 'readonly',
        console: 'readonly',
        URL: 'readonly',
        Request: 'readonly',
        Response: 'readonly',
        Event: 'readonly',
        CustomEvent: 'readonly',
        MessageEvent: 'readonly',
        ErrorEvent: 'readonly',
        CloseEvent: 'readonly',
        WebSocket: 'readonly',
        AudioContext: 'readonly',
        AudioWorkletNode: 'readonly',
        navigator: 'readonly',
        window: 'readonly',
        document: 'readonly',
        crypto: 'readonly',
        btoa: 'readonly',
        atob: 'readonly',
        setTimeout: 'readonly',
        clearTimeout: 'readonly',
        setInterval: 'readonly',
        clearInterval: 'readonly',
        self: 'readonly',
        caches: 'readonly',
        fetch: 'readonly',
        location: 'readonly',
        performance: 'readonly',
        globalThis: 'readonly',
        structuredClone: 'readonly',
        AudioWorkletProcessor: 'readonly',
        registerProcessor: 'readonly',
        sampleRate: 'readonly'
      }
    },
    rules: {
      'no-undef': 'off',
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }
      ],
      'svelte/no-navigation-without-resolve': 'off',
      'svelte/require-each-key': 'off',
      'svelte/no-at-html-tags': 'error'
    }
  },
  { files: ['**/*.svelte'], languageOptions: { parserOptions: { parser: ts.parser } } }
);
