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
    // The files of the build are written to _site/tokens/static/astro/ and requested as
    // /tokens/static/astro/…, which chassis-ui.com routes to this site by path. Under /static
    // it routes by the `Referer` header, and that of a script another script imports names no
    // site. The shared files stay on /static. Keep this folder in every name pattern below.
    assets: `tokens/static/astro`
  },
  integrations: [chassisDocs({ config }), ...chassis({ config, root })],
  vite: {
    environments: {
      client: {
        build: {
          rolldownOptions: {
            output: {
              entryFileNames: `tokens/static/astro/docs.[hash].js`,
              chunkFileNames: 'tokens/static/astro/docs.[hash].js'
              // assetFileNames: 'tokens/static/astro/docs.[hash][extname]'
            }
          }
        }
      }
    },
    // Required for CSS files
    build: {
      rolldownOptions: {
        output: {
          assetFileNames: 'tokens/static/astro/docs.[hash][extname]'
        }
      }
    },
    css: {
      preprocessorOptions: {
        scss: {
          // The integration adds the fallback `_chassis-tokens.scss` of `@chassis-ui/css`.
          // Custom override `_chassis-tokens.scss` if present in `src/scss`
          // loadPaths: [path.resolve(import.meta.dirname, 'src/scss')],
        }
      }
    }
  }
})
