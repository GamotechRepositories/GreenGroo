import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'
import { fileURLToPath } from 'url'
import { createRequire } from 'module'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const require = createRequire(import.meta.url)
const pakoRoot = path.dirname(require.resolve('pako/package.json'))
const reactRoot = path.dirname(require.resolve('react/package.json'))
const reactDomRoot = path.dirname(require.resolve('react-dom/package.json'))
const reactRouterDomRoot = path.dirname(require.resolve('react-router-dom/package.json'))

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(),tailwindcss()],
  resolve: {
    alias: {
      '@shared': path.resolve(__dirname, '../shared'),
      '@react-pdf/renderer': require.resolve('@react-pdf/renderer'),
      'pako/lib/zlib/zstream.js': path.join(pakoRoot, 'lib/zlib/zstream.js'),
      'pako/lib/zlib/deflate.js': path.join(pakoRoot, 'lib/zlib/deflate.js'),
      'pako/lib/zlib/inflate.js': path.join(pakoRoot, 'lib/zlib/inflate.js'),
      'pako/lib/zlib/constants.js': path.join(pakoRoot, 'lib/zlib/constants.js'),
      react: reactRoot,
      'react-dom': reactDomRoot,
      'react-router-dom': reactRouterDomRoot,
    },
  },
  server: {
    fs: {
      allow: ['..'],
    },
  },
})
