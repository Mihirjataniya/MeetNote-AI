import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: 'auto',
      includeAssets: ['favicon.svg', 'apple-touch-icon.png'],
      manifest: {
        name: 'MeetNote Ai',
        short_name: 'MeetNote',
        description:
          'Turn conversations into structured knowledge. Record meetings and get AI-written notes.',
        theme_color: '#111111',
        background_color: '#ffffff',
        display: 'standalone',
        start_url: '/',
        scope: '/',
        icons: [
          { src: '/pwa-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: '/pwa-512x512.png', sizes: '512x512', type: 'image/png' },
          {
            src: '/maskable-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        // Precache the built static shell only. Never intercept realtime traffic.
        globPatterns: ['**/*.{js,css,html,svg,png,woff2}'],
        navigateFallback: '/index.html',
        navigateFallbackDenylist: [/^\/api/, /^\/socket\.io/, /^\/room\//],
        // Don't try to serve API or socket responses from cache.
        runtimeCaching: [],
      },
      // Let the dev server work without the SW hijacking HMR/socket during dev.
      devOptions: { enabled: false },
    }),
  ],
  server: {
    host: true,
    allowedHosts: true,
    // Don't watch public/ — a locked asset there (e.g. an image still open in
    // an editor) makes the fs watcher throw a fatal EBUSY and kills the server.
    watch: {
      ignored: ['**/public/**'],
    },
    proxy: {
      '/socket.io': {
        target: 'http://localhost:3000',
        ws: true,
      },
      '/api': {
        target: 'http://localhost:3000',
      },
    },
  },
})
