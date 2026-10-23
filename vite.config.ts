import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'prompt',
      injectRegister: 'auto',
      includeAssets: [
        'favicon.ico',
        'favicon.svg',
        'favicon.png',
        'favicon-16x16.png',
        'favicon-32x32.png',
        'apple-touch-icon.png',
        'logo.png',
        'icons.svg',
        'offline.html',
        'splash/*.png',
      ],
      manifest: {
        name: 'Terra Guard V2',
        short_name: 'Terra Guard',
        description: 'Citizen Disaster Companion — Mobile-first flood and disaster safety guidance for everyday Malaysians.',
        id: '/',
        start_url: '/',
        scope: '/',
        display: 'standalone',
        orientation: 'portrait',
        lang: 'en',
        categories: ['utilities', 'weather', 'navigation'],
        theme_color: '#F8FAFC',
        background_color: '#F8FAFC',
        icons: [
          {
            src: '/pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any',
          },
          {
            src: '/pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any',
          },
          {
            src: '/pwa-maskable-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
          {
            src: '/apple-touch-icon.png',
            sizes: '180x180',
            type: 'image/png',
            purpose: 'any',
          },
        ],
        shortcuts: [
          {
            name: 'Emergency SOS & Kit',
            short_name: 'SOS & Kit',
            description: 'Instant emergency hotline access and 72-hour survival checklist',
            url: '/?tab=sos',
            icons: [
              {
                src: '/pwa-192x192.png',
                sizes: '192x192',
              },
            ],
          },
          {
            name: 'Live Hazard Map',
            short_name: 'Live Map',
            description: 'Live hazard zones, flood levels, and nearest evacuation shelters',
            url: '/?tab=map',
            icons: [
              {
                src: '/pwa-192x192.png',
                sizes: '192x192',
              },
            ],
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,webp,woff2}'],
        navigateFallback: '/index.html',
        navigateFallbackDenylist: [/^\/__/, /^\/api/],
        runtimeCaching: [
          // 1. Live IPU & DOE APIMS reading: Stale-While-Revalidate with caching
          {
            urlPattern: /^https:\/\/eqms\.doe\.gov\.my\/api3\/.*|^\/api\/apims.*/i,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'doe-apims-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 24 * 60 * 60, // 24 hours
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
          // 2. OpenWeather API: StaleWhileRevalidate fallback
          {
            urlPattern: /^https:\/\/api\.openweathermap\.org\/data\/2\.5\/.*/i,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'weather-cache',
              expiration: {
                maxEntries: 20,
                maxAgeSeconds: 6 * 60 * 60, // 6 hours
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
          // 3. Map tiles (CartoDB, OpenStreetMap, CARTO, etc.): CacheFirst capped at ~200 entries & 7 days
          {
            urlPattern: /https:\/\/[a-d]\.basemaps\.cartocdn\.com\/.*|https:\/\/[a-c]\.tile\.openstreetmap\.org\/.*|https:\/\/tile\.openstreetmap\.org\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'map-tiles-cache',
              expiration: {
                maxEntries: 200,
                maxAgeSeconds: 7 * 24 * 60 * 60, // 7 days
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
          // 4. Google Fonts stylesheets & webfonts
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'google-fonts-stylesheets',
            },
          },
          {
            urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-webfonts',
              expiration: {
                maxEntries: 30,
                maxAgeSeconds: 365 * 24 * 60 * 60,
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
          // 5. Explicitly NEVER cache Firebase Auth, Firestore writes, or AI calls
          {
            urlPattern: /^https:\/\/identitytoolkit\.googleapis\.com\/.*|^https:\/\/securetoken\.googleapis\.com\/.*|^https:\/\/firestore\.googleapis\.com\/.*|^https:\/\/generativelanguage\.googleapis\.com\/.*/i,
            handler: 'NetworkOnly',
          },
        ],
      },
    }),
  ],
  server: {
    proxy: {
      '/api/apims': {
        target: 'https://eqms.doe.gov.my',
        changeOrigin: true,
        rewrite: () =>
          '/api3/publicmapproxy/PUBLIC_DISPLAY/CAQM_MCAQM_Current_Reading/MapServer/0/query?where=1%3D1&outFields=*&returnGeometry=false&f=json',
        headers: {
          Referer: 'https://eqms.doe.gov.my/APIMS/main',
        },
      },
    },
  },
});
