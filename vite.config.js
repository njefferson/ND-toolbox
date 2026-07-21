import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

// Local-first PWA. No analytics, no third-party runtime. The service worker is
// generated at build time (Workbox) purely for offline precaching.
export default defineConfig({
  build: { target: 'es2020', sourcemap: true },
  plugins: [
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icons/apple-touch-icon.png', 'favicon.svg'],
      // App updates must never touch user data — we only precache app shell assets.
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,json,woff2}'],
        cleanupOutdatedCaches: true,
        navigateFallback: '/index.html',
      },
      manifest: {
        id: '/',
        name: 'ND Toolbox — Feelings Wheel',
        short_name: 'Feelings',
        description:
          'Find the precise word for what you feel. Local-first, no login, works offline.',
        start_url: '/',
        scope: '/',
        display: 'standalone',
        orientation: 'any',
        background_color: '#2E3440',
        theme_color: '#2E3440',
        categories: ['health', 'lifestyle', 'utilities'],
        icons: [
          { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
          { src: 'icons/maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
    }),
  ],
});
