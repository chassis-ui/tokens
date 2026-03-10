/**
 * @file logger.js
 * @description Centralized logging utilities for consistent output formatting
 * @copyright Copyright (c) 2026 Ozgur Gunes
 * @license MIT
 */

/**
 * Log levels for filtering output
 */
const LogLevel = {
  ERROR: 0,
  WARN: 1,
  INFO: 2,
  DEBUG: 3
}

const currentLevel = process.env.DEBUG ? LogLevel.DEBUG : LogLevel.INFO

/**
 * Format duration in seconds with 2 decimal places
 */
function formatDuration(ms) {
  return `${(ms / 1000).toFixed(2)}s`
}

/**
 * Logger utilities
 */
export default {
  /**
   * Log error messages (always shown)
   */
  error(message, error = null) {
    if (currentLevel >= LogLevel.ERROR) {
      console.error(`\n❌ ${message}`)
      if (error && process.env.DEBUG) {
        console.error(error.stack)
      } else if (error) {
        console.error(`   ${error.message}`)
      }
    }
  },

  /**
   * Log warning messages
   */
  warn(message) {
    if (currentLevel >= LogLevel.WARN) {
      console.warn(`⚠️  ${message}`)
    }
  },

  /**
   * Log info messages (default level)
   */
  info(message) {
    if (currentLevel >= LogLevel.INFO) {
      console.log(message)
    }
  },

  /**
   * Log debug messages (only when DEBUG env var is set)
   */
  debug(message) {
    if (currentLevel >= LogLevel.DEBUG) {
      console.log(`🔍 ${message}`)
    }
  },

  /**
   * Log section header
   */
  header(message) {
    if (currentLevel >= LogLevel.INFO) {
      console.log(`\n${message}\n`)
    }
  },

  /**
   * Log progress indicator
   */
  progress(current, total) {
    if (currentLevel >= LogLevel.INFO) {
      console.log(`[${current}/${total}]`)
    }
  },

  /**
   * Log divider
   */
  divider() {
    if (currentLevel >= LogLevel.INFO) {
      console.log('='.repeat(40))
    }
  },

  /**
   * Log build summary
   */
  summary(successCount, errorCount, startTime) {
    if (currentLevel >= LogLevel.INFO) {
      const duration = formatDuration(Date.now() - startTime)
      this.divider()
      console.log(
        `\n✅ ${successCount} succeeded${errorCount > 0 ? `, ❌ ${errorCount} failed` : ''}`
      )
      console.log(`⏱️  Completed in ${duration}\n`)
    }
  },

  /**
   * Log dry-run results
   */
  dryRun(tasks) {
    if (currentLevel >= LogLevel.INFO) {
      console.log(`\n🔍 Dry run - showing ${tasks.length} task(s) that would be generated:\n`)
      tasks.forEach((task) => {
        let id = `${task.platform}/${task.brand}-${task.app}`
        if (task.theme) id += `-${task.theme}`
        if (task.screen) id += `-${task.screen}`
        console.log(`  • ${id}`)
      })
      console.log()
    }
  }
}
