import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import pkg from './package.json'

const buildDate = new Date().toLocaleDateString('fr-FR', {
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
})

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  const githubWorkflow = process.env.GITHUB_WORKFLOW || ''

  const appVersion = githubWorkflow === 'release.yml' ? pkg.version : `DEV (${buildDate}) ${pkg.version}`

  return {
    server: {
      port: 1234,
    },
    plugins: [react()],
    build: {
      outDir: 'dist',
      emptyOutDir: true,
    },
    define: {
      'process.env': env,
      __APP_VERSION__: JSON.stringify(appVersion)
    },
    esbuild: {
      loader: 'jsx',
      include: /src\/.*\.jsx?$/,
      exclude: []
    },
    optimizeDeps: {
      esbuildOptions: {
        loader: {
          '.js': 'jsx',
        },
      },
    }
  }
})
