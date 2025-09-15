import eslint from '@eslint/js'
import eslintPluginAstro from 'eslint-plugin-astro'
import globals from 'globals'
import tseslint from 'typescript-eslint'
import prettierConfig from 'eslint-config-prettier';

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
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/triple-slash-reference': 'off',
    }
  },
  {
    files: ['**/*.js', '**/*.mjs'],
    languageOptions: {
      globals: globals.node
    }
  },
  {
    files: ['site/**/*.ts', 'site/**/*.tsx'],
    languageOptions: {
      parser: tseslint.parser,
      parserOptions: { project: './site/tsconfig.json' },
      globals: globals.node
    }
  },
  {
    files: ['site/**/*.astro'],
    languageOptions: {
      parser: eslintPluginAstro.parser,
      parserOptions: { project: './site/tsconfig.json' },
    }
  },
  {
    files: ['site/**/*.js', 'site/**/*.mjs'],
    languageOptions: {
      globals: globals.browser
    }
  }
]
