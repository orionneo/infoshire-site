import { defineConfig, loadEnv, type UserConfigExport } from 'vite';
import react from '@vitejs/plugin-react';
import svgr from 'vite-plugin-svgr';
import { VitePWA } from 'vite-plugin-pwa';
import path from 'path';

import { miaodaDevPlugin } from 'miaoda-sc-plugin';

export default defineConfig(({ mode }) => {
  // Carrega envs do Vite (VITE_*)
  const env = loadEnv(mode, process.cwd(), '');

  // Detecta GitHub Actions (Pages)
  const isGH = process.env.GITHUB_ACTIONS === 'true';

  /**
   * Base path:
   * - Produção com domínio próprio: "/"
   * - GitHub Pages em subpath (QA): "/infoshire-site/"
   * - Pode ser forçado via VITE_BASE_PATH no workflow
   */
  const basePathRaw =
    (env.VITE_BASE_PATH && env.VITE_BASE_PATH.trim()) ||
    (isGH ? '/infoshire-site/' : '/');

  // Normaliza para sempre começar e terminar com "/"
  const normalizedBase =
    '/' + basePathRaw.replace(/^\/+/, '').replace(/\/+$/, '') + '/';

  // Plugins (tipados como any[] para evitar conflitos de tipagem)
  const plugins: any[] = [
    react(),

    svgr({
      svgrOptions: {
        icon: true,
        exportType: 'named',
        namedExport: 'ReactComponent',
      },
    }),

    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.png'],
      manifest: {
        name: 'InfoShire - Assistência Técnica',
        short_name: 'InfoShire',
        description:
          'Sistema de acompanhamento de ordens de serviço - Assistência técnica especializada em eletrônicos, computadores e videogames',
        theme_color: '#00FF00',
        background_color: '#000000',
        display: 'standalone',
        orientation: 'portrait',

        // IMPORTANTE: alinhar com o base
        scope: normalizedBase,
        start_url: normalizedBase,

        icons: [
          {
            src: 'icons/icon-192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any',
          },
          {
            src: 'icons/icon-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any',
          },
          {
            src: 'icons/icon-192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'maskable',
          },
          {
            src: 'icons/icon-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },

      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff,woff2}'],
        maximumFileSizeToCacheInBytes: 3 * 1024 * 1024,
        cleanupOutdatedCaches: true,
        skipWaiting: true,
        clientsClaim: true,

        runtimeCaching: [
          {
            urlPattern: /^https:\/\/.*\.supabase\.co\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'supabase-cache-v74',
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 60 * 24,
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
        ],
      },

      devOptions: {
        enabled: true,
      },
    }),

    miaodaDevPlugin(),
  ];

  const config = {
    base: normalizedBase,

    plugins,

    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
  } satisfies UserConfigExport;

  return config;
});
