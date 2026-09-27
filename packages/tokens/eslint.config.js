import { defineConfig } from 'eslint/config'
import eslint from '@eslint/js'
import globals from 'globals'
import prettierPlugin from 'eslint-plugin-prettier/recommended'

export default defineConfig([
  {
    ignores: ['dist/', 'dist-next/']
  },
  eslint.configs.recommended,
  prettierPlugin,
  {
    rules: {
      'no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
      'no-useless-escape': 'warn',
      'prettier/prettier': 'warn'
    }
  },
  {
    files: ['**/*.js'],
    languageOptions: {
      globals: globals.node
    }
  }
])
