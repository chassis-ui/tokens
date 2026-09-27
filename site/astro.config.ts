import path from 'node:path'
import { defineConfig } from 'astro/config'
import { chassis } from './src/libs/astro'
import { getConfig } from './src/libs/config'
import { chassisAutoImportPlugin } from './src/libs/shortcode'
import { remarkCxConfig, remarkCxDocsref } from './src/libs/remark'
import { getSiteUrl, getDocsMarkdownConfig } from '@chassis-ui/docs'

// https://astro.build/config
export default defineConfig({
  site: getSiteUrl(getConfig()),
  outDir: '_site',
  build: {
    assets: `static/astro`
  },
  integrations: [chassis()],
  markdown: getDocsMarkdownConfig({
    anchors: getConfig().anchors,
    remarkPlugins: [chassisAutoImportPlugin(), remarkCxConfig, remarkCxDocsref]
  }),
  vite: {
    environments: {
      client: {
        build: {
          rolldownOptions: {
            output: {
              entryFileNames: `static/astro/docs.[hash].js`,
              chunkFileNames: 'static/astro/docs.[hash].js'
              // assetFileNames: 'static/astro/docs.[hash][extname]'
            }
          }
        }
      }
    },
    // Required for CSS files
    build: {
      rolldownOptions: {
        output: {
          assetFileNames: 'static/astro/docs.[hash][extname]'
        }
      }
    },
    css: {
      preprocessorOptions: {
        scss: {
          loadPaths: [
            // Custom override `_chassis-tokens.scss` if present in `src/scss`
            // path.resolve(import.meta.dirname, 'src/scss'),
            // Framework fallback `_chassis-tokens.scss` if no override above.
            path.resolve(import.meta.dirname, 'node_modules/@chassis-ui/css/scss/vendor')
          ],
          // Resolve `@chassis-ui/tokens/...` imports to the workspace package in
          // `packages/tokens/`. The framework fallback `_chassis-tokens.scss` in
          // `@chassis-ui/css` forwards `@chassis-ui/tokens/dist/...`, which would otherwise
          // resolve to the published version that `@chassis-ui/css` depends on.
          importers: [
            {
              findFileUrl(url: string) {
                if (!url.startsWith('@chassis-ui/tokens/')) return null
                const subPath = url.slice('@chassis-ui/tokens/'.length)
                const rootDir = path.resolve(import.meta.dirname, 'node_modules/@chassis-ui/tokens')
                return new URL('file://' + rootDir + '/' + subPath)
              }
            }
          ]
        }
      }
    }
  }
})
