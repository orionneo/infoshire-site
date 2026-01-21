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

    /**
     * ✅ PWA estável para iOS/Safari + Web:
     * - NUNCA "autoUpdate" em produção (causa travamentos/spinners em sessão ativa)
     * - NUNCA skipWaiting/clientsClaim em produção (sequestra a aba/PWA e quebra requests)
     * - start_url SEM "#/" (iOS frequentemente reabre sem hash; HashRouter resolve no runtime)
     */
    VitePWA({
      // 🚫 Evita troca de SW no meio da sessão
      registerType: 'prompt',
      injectRegister: 'auto',

      includeAssets: ['favicon.png'],

      manifest: {
        name: 'InfoShire - Assistência Técnica',
        short_name: 'InfoShire',
        description:
          'Sistema de acompanhamento de ordens de serviço - Assistência técnica especializada em eletrônicos, computadores e videogames',
        theme_color: '#00FF00',
        background_color: '#000000',
        display: 'standalone',
        lang: 'pt-BR',
        orientation: 'portrait',

        // ✅ Para GH Pages e domínio:
        // scope precisa ser o base do app
        scope: normalizedBase,

        // ✅ iOS/PWA: sem "#/" para não abrir "sem hash e quebrar"
        // O HashRouter cuida do resto depois que o index carrega
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

        // 🚫 CRÍTICO: NÃO assumir controle de sessão ativa
        skipWaiting: false,
        clientsClaim: false,

        runtimeCaching: [
          /**
           * ✅ CRÍTICO (PWA/iOS): NÃO cachear Supabase.
           * NetworkOnly = sempre rede, sem cache.
           */
          {
            urlPattern: /^https:\/\/.*\.supabase\.co\/.*/i,
            handler: 'NetworkOnly',
            options: {
              cacheName: 'supabase-network-only',
            },
          },
        ],
      },

      // Dev: pode deixar ligado para testar SW localmente.
      // Em produção isso não afeta.
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
