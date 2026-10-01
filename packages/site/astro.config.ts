import path from 'node:path'
import { defineConfig } from 'astro/config'
import { loadConfig } from '@chassis-ui/docs'
import { chassisDocs } from '@chassis-ui/docs/integration'
import { chassis } from './src/libs/astro'

const root = import.meta.dirname
const config = loadConfig({ root })

// https://astro.build/config
export default defineConfig({
  outDir: '../../_site',
  build: {
    assets: `static/astro`,
    // The site is served under /tokens of chassis-ui.com, where /static belongs to the main
    // site. With `staticPath` of config.yml, every static file is requested under /tokens/static.
    assetsPrefix: '/tokens'
  },
  integrations: [chassisDocs({ config }), ...chassis({ config, root })],
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
          // The integration adds the fallback `_chassis-tokens.scss` of `@chassis-ui/css`.
          // Custom override `_chassis-tokens.scss` if present in `src/scss`
          // loadPaths: [path.resolve(import.meta.dirname, 'src/scss')],
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
