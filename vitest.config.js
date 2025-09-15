// eslint-disable-next-line import/no-unresolved
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    // Test files location
    include: ['test/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts}'],

    // Test environment
    environment: 'node',

    // Global test settings
    globals: true,

    // Coverage settings
    coverage: {
      reporter: ['text'],
      include: ['build/tokens/**/*.js'],
      exclude: [
        'node_modules/**',
        'dist/**'
      ]
    },

    // Test timeout
    testTimeout: 10000,

    // Setup files
    setupFiles: []
  }
})
