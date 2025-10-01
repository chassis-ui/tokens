import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    // Test files location
    include: ['tests/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts}'],

    // Test environment
    environment: 'node',

    // Global test settings
    globals: true,

    // Coverage settings
    coverage: {
      reporter: ['text', 'html'],
      include: ['build/**/*.js'],
      exclude: [
        'build/**/*.test.js',
        'build/**/*.spec.js',
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
