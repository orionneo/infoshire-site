# 🔧 Implementação Técnica - PWA

## 📋 Resumo da Implementação

Transformamos a aplicação web InfoShire em um Progressive Web App (PWA) completo, permitindo instalação em dispositivos móveis iOS e Android.

---

## 📦 Pacotes Instalados

```bash
pnpm add -D vite-plugin-pwa workbox-window
```

### Dependências

- **vite-plugin-pwa**: Plugin Vite para gerar PWA
- **workbox-window**: Biblioteca Google para Service Workers

---

## ⚙️ Configuração do Vite

### Arquivo: `vite.config.ts`

```typescript
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    // ... outros plugins
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png'],
      manifest: {
        name: 'InfoShire - Assistência Técnica',
        short_name: 'InfoShire',
        description: 'Sistema de acompanhamento de ordens de serviço',
        theme_color: '#00FF00',
        background_color: '#000000',
        display: 'standalone',
        orientation: 'portrait',
        scope: '/',
        start_url: '/',
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any'
          },
          {
            src: 'pwa-maskable-192x192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'maskable'
          },
          {
            src: 'pwa-maskable-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable'
          }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff,woff2}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/.*\.supabase\.co\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'supabase-cache',
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 60 * 24 // 24 hours
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          },
          {
            urlPattern: /^https:\/\/.*\.medo\.dev\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'images-cache',
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 * 24 * 30 // 30 days
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          }
        ]
      },
      devOptions: {
        enabled: true
      }
    })
  ]
});
```

---

## 📱 Componente de Instalação

### Arquivo: `src/components/PWAInstallPrompt.tsx`

**Funcionalidades:**

1. **Detecção de Plataforma**
   - Identifica iOS vs Android
   - Verifica se já está instalado
   - Detecta modo standalone

2. **Prompt Inteligente**
   - Android: Banner com botão "Instalar"
   - iOS: Instruções passo a passo
   - Pode ser dispensado (volta em 7 dias)

3. **Estados Gerenciados**
   ```typescript
   const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
   const [showPrompt, setShowPrompt] = useState(false);
   const [isIOS, setIsIOS] = useState(false);
   const [isStandalone, setIsStandalone] = useState(false);
   ```

4. **Event Listeners**
   ```typescript
   window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
   ```

5. **LocalStorage**
   - Salva data de dismissal
   - Respeita período de 7 dias
   - Chave: `pwa-install-dismissed`

---

## 🎨 Web App Manifest

### Campos Principais

```json
{
  "name": "InfoShire - Assistência Técnica",
  "short_name": "InfoShire",
  "description": "Sistema de acompanhamento de ordens de serviço - Assistência técnica especializada em eletrônicos, computadores, videogames e celulares",
  "theme_color": "#00FF00",
  "background_color": "#000000",
  "display": "standalone",
  "orientation": "portrait",
  "scope": "/",
  "start_url": "/"
}
```

### Explicação dos Campos

- **name**: Nome completo do app (aparece na instalação)
- **short_name**: Nome curto (aparece no ícone)
- **description**: Descrição para SEO e lojas
- **theme_color**: Cor da barra de status (#00FF00 - verde neon)
- **background_color**: Cor de fundo da splash screen (#000000 - preto)
- **display**: Modo de exibição (standalone = tela cheia)
- **orientation**: Orientação preferida (portrait = vertical)
- **scope**: Escopo do app (/ = todo o site)
- **start_url**: URL inicial ao abrir (/ = home)

---

## 🔄 Service Worker e Cache

### Estratégias de Cache

#### 1. NetworkFirst (Supabase)

```javascript
{
  urlPattern: /^https:\/\/.*\.supabase\.co\/.*/i,
  handler: 'NetworkFirst',
  options: {
    cacheName: 'supabase-cache',
    expiration: {
      maxEntries: 50,
      maxAgeSeconds: 60 * 60 * 24 // 24 hours
    }
  }
}
```

**Comportamento:**
1. Tenta buscar da rede primeiro
2. Se falhar, usa cache
3. Atualiza cache com resposta da rede
4. Ideal para dados que mudam frequentemente

**Uso:**
- Ordens de serviço
- Mensagens
- Status updates
- Dados do usuário

#### 2. CacheFirst (Imagens)

```javascript
{
  urlPattern: /^https:\/\/.*\.medo\.dev\/.*/i,
  handler: 'CacheFirst',
  options: {
    cacheName: 'images-cache',
    expiration: {
      maxEntries: 100,
      maxAgeSeconds: 60 * 60 * 24 * 30 // 30 days
    }
  }
}
```

**Comportamento:**
1. Verifica cache primeiro
2. Se não tiver, busca da rede
3. Salva no cache para próxima vez
4. Ideal para recursos estáticos

**Uso:**
- Fotos dos equipamentos
- Logos
- Ícones
- Imagens do site

---

## 🖼️ Ícones do PWA

### Tamanhos Necessários

1. **192x192 pixels** (any)
   - Ícone padrão
   - Usado em telas de baixa resolução

2. **512x512 pixels** (any)
   - Ícone de alta resolução
   - Usado em telas de alta resolução

3. **192x192 pixels** (maskable)
   - Ícone com safe zone
   - Usado em Android adaptativo

4. **512x512 pixels** (maskable)
   - Ícone maskable de alta resolução
   - Usado em Android adaptativo

### Formato Maskable

**Safe Zone:**
- Área central: 80% do ícone
- Borda: 10% de cada lado
- Garante que ícone não seja cortado

**Exemplo:**
```
┌─────────────────┐
│  10%  (borda)   │
│ ┌─────────────┐ │
│ │             │ │
│ │   80% safe  │ │
│ │             │ │
│ └─────────────┘ │
│  10%  (borda)   │
└─────────────────┘
```

---

## 🔧 Integração no App

### Arquivo: `src/App.tsx`

```typescript
import { PWAInstallPrompt } from '@/components/PWAInstallPrompt';

const App: React.FC = () => {
  return (
    <Router>
      <AuthProvider>
        <RouteGuard>
          {/* ... rotas ... */}
          <PWAInstallPrompt />
          <Toaster />
        </RouteGuard>
      </AuthProvider>
    </Router>
  );
};
```

**Posicionamento:**
- Dentro do Router
- Dentro do AuthProvider
- Dentro do RouteGuard
- Antes do Toaster

**Motivo:**
- Acesso ao contexto de autenticação
- Acesso ao roteamento
- Renderizado em todas as páginas
- Não interfere com toasts

---

## 📊 Métricas e Analytics

### Eventos a Rastrear

1. **beforeinstallprompt**
   - Quando o prompt é disponibilizado
   - Quantos usuários são elegíveis

2. **appinstalled**
   - Quando o app é instalado
   - Taxa de conversão

3. **Standalone Mode**
   - Quantos acessos via app instalado
   - vs acessos via navegador

### Implementação (Opcional)

```typescript
// Track install prompt shown
window.addEventListener('beforeinstallprompt', (e) => {
  // Analytics: prompt_shown
  gtag('event', 'pwa_prompt_shown');
});

// Track app installed
window.addEventListener('appinstalled', () => {
  // Analytics: app_installed
  gtag('event', 'pwa_installed');
});

// Track standalone usage
if (window.matchMedia('(display-mode: standalone)').matches) {
  // Analytics: standalone_usage
  gtag('event', 'pwa_standalone_usage');
}
```

---

## 🧪 Testes

### Checklist de Testes

#### Desktop

- [ ] Prompt de instalação aparece (Chrome)
- [ ] Instalação funciona
- [ ] App abre em janela separada
- [ ] Cache funciona offline
- [ ] Atualização automática funciona

#### Android

- [ ] Prompt de instalação aparece
- [ ] Botão "Instalar" funciona
- [ ] Ícone aparece na tela inicial
- [ ] App abre em tela cheia
- [ ] Barra de status tem cor correta
- [ ] Cache funciona offline
- [ ] Fotos carregam do cache

#### iOS

- [ ] Instruções aparecem
- [ ] Adicionar à tela inicial funciona
- [ ] Ícone aparece na tela inicial
- [ ] App abre em tela cheia
- [ ] Barra de status tem cor correta
- [ ] Cache funciona offline
- [ ] Fotos carregam do cache

### Ferramentas de Teste

1. **Chrome DevTools**
   - Application → Manifest
   - Application → Service Workers
   - Application → Cache Storage
   - Lighthouse → PWA Audit

2. **Firefox DevTools**
   - Application → Manifest
   - Application → Service Workers

3. **Safari DevTools**
   - Develop → Service Workers
   - Develop → Clear Caches

---

## 🐛 Troubleshooting

### Problemas Comuns

#### 1. Prompt não aparece

**Causas:**
- Já instalado
- Já dispensado recentemente
- Não está em HTTPS
- Service Worker não registrado

**Solução:**
```javascript
// Limpar localStorage
localStorage.removeItem('pwa-install-dismissed');

// Desregistrar service worker
navigator.serviceWorker.getRegistrations().then(registrations => {
  registrations.forEach(registration => registration.unregister());
});

// Recarregar página
location.reload();
```

#### 2. Cache não funciona

**Causas:**
- Service Worker não ativo
- Padrões de URL incorretos
- Cache desabilitado no navegador

**Solução:**
```javascript
// Verificar service worker
navigator.serviceWorker.getRegistrations().then(registrations => {
  console.log('Service Workers:', registrations);
});

// Verificar cache
caches.keys().then(keys => {
  console.log('Cache Keys:', keys);
});
```

#### 3. Ícones não aparecem

**Causas:**
- Arquivos não existem
- Caminhos incorretos
- Tamanhos errados

**Solução:**
- Verificar se arquivos existem em `/public`
- Verificar nomes dos arquivos
- Verificar tamanhos (192x192, 512x512)

---

## 🚀 Deploy

### Checklist de Deploy

- [ ] Build de produção
- [ ] Service Worker gerado
- [ ] Manifest gerado
- [ ] Ícones no diretório correto
- [ ] HTTPS habilitado
- [ ] Cache configurado
- [ ] Testes em dispositivos reais

### Comandos

```bash
# Build de produção
npm run build

# Verificar arquivos gerados
ls -la dist/

# Deve conter:
# - manifest.webmanifest
# - sw.js (service worker)
# - workbox-*.js
# - pwa-*.png (ícones)
```

---

## 📈 Otimizações Futuras

### 1. Notificações Push

```typescript
// Solicitar permissão
Notification.requestPermission().then(permission => {
  if (permission === 'granted') {
    // Registrar push subscription
  }
});
```

### 2. Background Sync

```typescript
// Sincronizar quando voltar online
navigator.serviceWorker.ready.then(registration => {
  registration.sync.register('sync-messages');
});
```

### 3. Periodic Background Sync

```typescript
// Atualizar dados periodicamente
navigator.serviceWorker.ready.then(registration => {
  registration.periodicSync.register('update-orders', {
    minInterval: 24 * 60 * 60 * 1000 // 24 hours
  });
});
```

### 4. Share API

```typescript
// Compartilhar ordem de serviço
if (navigator.share) {
  navigator.share({
    title: 'Minha Ordem de Serviço',
    text: 'Acompanhe o reparo do meu equipamento',
    url: window.location.href
  });
}
```

---

## 📚 Recursos

### Documentação

- [MDN - Progressive Web Apps](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps)
- [web.dev - PWA](https://web.dev/progressive-web-apps/)
- [Vite PWA Plugin](https://vite-pwa-org.netlify.app/)
- [Workbox](https://developers.google.com/web/tools/workbox)

### Ferramentas

- [PWA Builder](https://www.pwabuilder.com/)
- [Lighthouse](https://developers.google.com/web/tools/lighthouse)
- [Maskable.app](https://maskable.app/) (editor de ícones maskable)

---

**InfoShire - PWA Técnico** 🔧⚡
