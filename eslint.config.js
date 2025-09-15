import eslint from '@eslint/js'
import eslintPluginAstro from 'eslint-plugin-astro'
import globals from 'globals'
import tseslint from 'typescript-eslint'

export default [
  // Global ignores
  {
    ignores: [
      '**/*.min.js',
      '**/dist/',
      '**/vendor/',
      '_site/',
      'site/public/',
      'site/assets/',
      'site/.astro/',
      'node_modules/',
      '.cache/',
      'reference/**/*.md'
    ]
  },
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  ...eslintPluginAstro.configs.recommended,
  {
    files: ['**/*.js', '**/*.mjs'],
    languageOptions: {
      globals: globals.node
    }
  },
  {
    files: ['site/**/*.js', 'site/**/*.mjs'],
    languageOptions: {
      globals: {
        localStorage: 'readonly',
        console: 'readonly',
        window: 'readonly',
        document: 'readonly',
        navigator: 'readonly',
        location: 'readonly'
      }
    }
  }
]
