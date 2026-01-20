import { defineConfig, loadEnv, type UserConfigExport } from 'vite';
import react from '@vitejs/plugin-react';
import svgr from 'vite-plugin-svgr';
import { VitePWA } from 'vite-plugin-pwa';
import path from 'path';

import { miaodaDevPlugin } from 'miaoda-sc-plugin';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const isGH = process.env.GITHUB_ACTIONS === 'true';

  const basePathRaw =
    (env.VITE_BASE_PATH && env.VITE_BASE_PATH.trim()) ||
    (isGH ? '/infoshire-site/' : '/');

  // ✅ NORMALIZAÇÃO CORRETA:
  // se for root ("/" ou ""), retorna "/"
  // senão garante "/xxx/"
  const cleaned = (basePathRaw || '').trim();
  const normalizedBase =
    cleaned === '' || cleaned === '/'
      ? '/'
      : '/' + cleaned.replace(/^\/+/, '').replace(/\/+$/, '') + '/';

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

        // ✅ alinhar com o base
        scope: normalizedBase,
        start_url: normalizedBase,

        icons: [
          { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
          { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'maskable' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
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
              cacheName: 'supabase-cache-v75',
              expiration: { maxEntries: 50, maxAgeSeconds: 60 * 60 * 24 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],
      },
      devOptions: { enabled: true },
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
