import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'


export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  // Set the third parameter to '' to load all env regardless of the
  // `` prefix.
  const env = loadEnv(mode, process.cwd(), '')

  return {
    server: {
      port: 1234,
    },
    esbuild: {
      include: [/\.[jt]sx?$/],
      exclude: [],
      loader: 'jsx',
    },
    plugins: [react()],
    build: {
      outDir: '../adno-full',
      emptyOutDir: true, // also necessary
    },
    define: {
      'process.env': env
    }
  }
})
