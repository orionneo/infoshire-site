import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import svgr from 'vite-plugin-svgr';
import { VitePWA } from 'vite-plugin-pwa';
import path from 'path';

import { miaodaDevPlugin } from 'miaoda-sc-plugin';

// Detecta quando está rodando no GitHub Actions (Pages)
const isGH = process.env.GITHUB_ACTIONS === 'true';

export default defineConfig({
  // ✅ Isso é o que resolve o 404 do Pages
  base: isGH ? '/infoshire-site/' : '/',

  plugins: [
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

        // ✅ IMPORTANTE: alinhar com o base, senão o PWA pode quebrar no Pages
        scope: isGH ? '/infoshire-site/' : '/',
        start_url: isGH ? '/infoshire-site/' : '/',

        icons: [
          {
            src: 'https://miaoda-conversation-file.s3cdn.medo.dev/user-7zo72h3r905c/conv-8pj0bpgfx6v4/20260108/file-8slbycf711c0.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any',
          },
          {
            src: 'https://miaoda-conversation-file.s3cdn.medo.dev/user-7zo72h3r905c/conv-8pj0bpgfx6v4/20260108/file-8slbz7zou9kw.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any',
          },
          {
            src: 'https://miaoda-conversation-file.s3cdn.medo.dev/user-7zo72h3r905c/conv-8pj0bpgfx6v4/20260108/file-8slbycf711c0.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'maskable',
          },
          {
            src: 'https://miaoda-conversation-file.s3cdn.medo.dev/user-7zo72h3r905c/conv-8pj0bpgfx6v4/20260108/file-8slbz7zou9kw.png',
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
              cacheName: 'supabase-cache-v73',
              expiration: { maxEntries: 50, maxAgeSeconds: 60 * 60 * 24 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            urlPattern: /^https:\/\/.*\.medo\.dev\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'images-cache-v73',
              expiration: { maxEntries: 100, maxAgeSeconds: 60 * 60 * 24 * 30 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],
      },
      devOptions: { enabled: true },
    }),
    miaodaDevPlugin(),
  ],

  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});