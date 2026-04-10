import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      plugins: [react()],
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
