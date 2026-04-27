import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      plugins: [
        react(),
        VitePWA({
          registerType: 'autoUpdate',
          includeAssets: ['favicon.svg'],
          manifest: {
            name: 'Task-Me Realty',
            short_name: 'Task-Me',
            description: 'Property & Tenant Management System',
            theme_color: '#9D1F15',
            background_color: '#F8F9FA',
            display: 'standalone',
            start_url: '/',
            icons: [
              { src: 'favicon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any maskable' },
            ],
          },
          workbox: {
            // Cache all Vite-generated assets (JS chunks, CSS) with CacheFirst — they have content-hash names so they never go stale
            globPatterns: ['**/*.{js,css,html,svg,woff2}'],
            runtimeCaching: [
              {
                // Google Fonts stylesheets
                urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
                handler: 'CacheFirst',
                options: { cacheName: 'google-fonts-cache', expiration: { maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 365 } },
              },
              {
                // Google Fonts files
                urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
                handler: 'CacheFirst',
                options: { cacheName: 'gstatic-fonts-cache', expiration: { maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 365 } },
              },
              {
                // Supabase API — NetworkFirst so data is always fresh; falls back to cache when offline
                urlPattern: /^https:\/\/.*\.supabase\.co\/.*/i,
                handler: 'NetworkFirst',
                options: { cacheName: 'supabase-api-cache', networkTimeoutSeconds: 10, expiration: { maxEntries: 50, maxAgeSeconds: 60 * 5 } },
              },
            ],
          },
        }),
      ],
      build: {
        rollupOptions: {
          output: {
            manualChunks(id) {
              // ── Vendor libraries ──────────────────────────────────────────
              if (id.includes('node_modules/react-dom') || id.includes('node_modules/react/'))
                return 'vendor-react';
              if (id.includes('node_modules/@tanstack'))
                return 'vendor-query';
              if (id.includes('node_modules/@supabase'))
                return 'vendor-supabase';
              if (id.includes('node_modules/chart.js') || id.includes('node_modules/react-chartjs-2'))
                return 'vendor-charts';

              // ── Route chunks — each area loads only when first visited ────
              if (id.includes('/components/registration/'))  return 'route-registration';
              if (id.includes('/components/tenants/'))       return 'route-tenants';
              if (id.includes('/components/landlords/'))     return 'route-landlords';
              if (id.includes('/components/field-ops/') || id.includes('/components/operations/'))
                                                             return 'route-operations';
              if (id.includes('/components/payments/'))      return 'route-payments';
              if (id.includes('/components/hr/'))            return 'route-hr';
              if (id.includes('/components/accounting/'))    return 'route-accounting';
              if (id.includes('/components/analytics/') || id.includes('/components/reports/'))
                                                             return 'route-analytics';
              if (id.includes('/components/marketplace/'))   return 'route-marketplace';
              if (id.includes('/components/r-reits/'))       return 'route-reits';
              if (id.includes('/components/settings/'))      return 'route-settings';
              if (id.includes('/components/userAppPortal/')) return 'route-portals';
            },
          },
        },
        chunkSizeWarningLimit: 600,
      },
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});
