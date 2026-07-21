import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';
import { readFileSync } from 'node:fs';
import { execSync } from 'node:child_process';

// Local-first PWA. No analytics, no third-party runtime. The service worker is
// generated at build time (Workbox) purely for offline precaching.
const pkg = JSON.parse(readFileSync(new URL('./package.json', import.meta.url)));
let buildId = 'dev';
try {
  buildId = execSync('git rev-parse --short HEAD', { stdio: ['ignore', 'pipe', 'ignore'] })
    .toString().trim();
} catch { /* not a git checkout — leave as 'dev' */ }

export default defineConfig({
  // A discreet version + build id, baked in so it appears in screenshots.
  define: {
    __APP_VERSION__: JSON.stringify(pkg.version),
    __BUILD_ID__: JSON.stringify(buildId),
  },
  build: { target: 'es2020', sourcemap: true },
  plugins: [
    VitePWA({
      // Opt-in updates: a new version is downloaded but NEVER applied until the
      // user taps "Update now". Combined with the in-app "Pause updates" toggle,
      // nothing changes under someone who is settled in. Registration is driven
      // manually via virtual:pwa-register (see shell/services/updates.js).
      registerType: 'prompt',
      injectRegister: false,
      includeAssets: ['icons/apple-touch-icon.png', 'favicon.svg'],
      // App updates must never touch user data — we only precache app shell assets.
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,json,woff2}'],
        // Keep the offline precache lean: the social tile is only for crawlers,
        // and the large 512px install icons aren't used by the running app (its
        // mark is inline SVG) — the OS fetches them at install time.
        globIgnores: ['**/social/**', '**/icons/*-512.png'],
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
