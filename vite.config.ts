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
            manualChunks: {
              // Core React runtime
              'vendor-react': ['react', 'react-dom'],
              // Data layer
              'vendor-query': ['@tanstack/react-query'],
              'vendor-supabase': ['@supabase/supabase-js'],
              // Charts (heavy)
              'vendor-charts': ['chart.js', 'react-chartjs-2'],
            },
          },
        },
        // Raise the warning threshold so chart.js vendor chunk doesn't warn
        chunkSizeWarningLimit: 1000,
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
