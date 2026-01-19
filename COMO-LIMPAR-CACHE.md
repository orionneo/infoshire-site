# Como Limpar o Cache do Navegador - InfoShire

## Por que preciso limpar o cache?

O sistema InfoShire é um PWA (Progressive Web App) que armazena arquivos em cache para funcionar offline. Quando fazemos atualizações no sistema, o navegador pode continuar usando os arquivos antigos em cache, fazendo com que você não veja as alterações mais recentes.

## Sintomas de Cache Desatualizado

- ✗ Alterações visíveis no mobile mas não no desktop
- ✗ Logo antigo ainda aparecendo
- ✗ Fotos antigas ainda sendo exibidas
- ✗ Conteúdo desatualizado (ex: ainda mostrando "smartphones")

---

## 🔧 Soluções por Navegador

### Google Chrome / Edge (Desktop)

#### Método 1: Hard Refresh (Mais Rápido)
1. Abra o site InfoShire
2. Pressione **Ctrl + Shift + R** (Windows/Linux) ou **Cmd + Shift + R** (Mac)
3. Aguarde o site recarregar completamente

#### Método 2: Limpar Cache Completo (Mais Efetivo)
1. Pressione **Ctrl + Shift + Delete** (ou **Cmd + Shift + Delete** no Mac)
2. Na janela que abrir:
   - Selecione **"Todo o período"** no menu suspenso
   - Marque **"Imagens e arquivos em cache"**
   - Marque **"Cookies e outros dados do site"** (opcional, mas recomendado)
3. Clique em **"Limpar dados"**
4. Feche TODAS as abas do site InfoShire
5. Feche o navegador completamente
6. Abra o navegador novamente e acesse o site

#### Método 3: DevTools (Para Desenvolvedores)
1. Pressione **F12** para abrir o DevTools
2. Clique com botão direito no ícone de **Recarregar** (ao lado da barra de endereço)
3. Selecione **"Esvaziar cache e recarregar forçadamente"**
4. Vá para a aba **Application** no DevTools
5. No menu lateral, clique em **"Storage"**
6. Clique em **"Clear site data"**
7. Feche o DevTools e recarregue a página

---

### Firefox (Desktop)

#### Método 1: Hard Refresh
1. Abra o site InfoShire
2. Pressione **Ctrl + Shift + R** (Windows/Linux) ou **Cmd + Shift + R** (Mac)

#### Método 2: Limpar Cache
1. Pressione **Ctrl + Shift + Delete**
2. Selecione **"Tudo"** no intervalo de tempo
3. Marque **"Cache"** e **"Cookies"**
4. Clique em **"Limpar agora"**
5. Feche todas as abas do site e reabra

---

### Safari (Mac)

#### Método 1: Hard Refresh
1. Abra o site InfoShire
2. Pressione **Cmd + Option + R**

#### Método 2: Limpar Cache
1. No menu Safari, vá em **Preferências** → **Avançado**
2. Marque **"Mostrar menu Desenvolver na barra de menus"**
3. No menu **Desenvolver**, clique em **"Esvaziar Caches"**
4. Recarregue a página

---

### Mobile (Chrome/Safari)

#### Android (Chrome)
1. Abra o Chrome
2. Toque nos **três pontos** no canto superior direito
3. Vá em **Configurações** → **Privacidade e segurança**
4. Toque em **"Limpar dados de navegação"**
5. Selecione **"Todo o período"**
6. Marque **"Imagens e arquivos em cache"**
7. Toque em **"Limpar dados"**
8. Feche o app completamente e reabra

#### iOS (Safari)
1. Vá em **Ajustes** do iPhone/iPad
2. Role até **Safari**
3. Toque em **"Limpar Histórico e Dados de Sites"**
4. Confirme tocando em **"Limpar Histórico e Dados"**
5. Abra o Safari novamente e acesse o site

---

## 🚀 Solução Definitiva: Desinstalar e Reinstalar PWA

Se nenhum dos métodos acima funcionar, você pode desinstalar completamente o PWA:

### Desktop
1. No Chrome, vá em **chrome://apps**
2. Clique com botão direito no ícone **InfoShire**
3. Selecione **"Remover do Chrome"**
4. Acesse o site novamente e reinstale o PWA quando solicitado

### Mobile
1. Encontre o ícone do app **InfoShire** na tela inicial
2. Mantenha pressionado e selecione **"Remover"** ou **"Desinstalar"**
3. Abra o navegador, acesse o site e reinstale quando solicitado

---

## ✅ Como Verificar se o Cache Foi Limpo

Após limpar o cache, verifique se você vê:

- ✓ Novo logo InfoShire com dragão verde na página inicial
- ✓ Fotos atualizadas na página de Contato
- ✓ Remoção de todas as referências a "smartphones" ou "celulares"
- ✓ Apenas 2 cards de serviços na página inicial (Notebooks e Videogames)

---

## 🆘 Ainda não funcionou?

Se após seguir todos os passos acima você ainda não vê as atualizações:

1. **Verifique se está acessando o domínio correto** (não uma versão em cache do navegador)
2. **Tente em modo anônimo/privado** do navegador
3. **Tente em outro navegador** para confirmar que as alterações estão no servidor
4. **Aguarde alguns minutos** - o Service Worker pode levar um tempo para atualizar
5. **Entre em contato com o suporte técnico** se o problema persistir

---

## 📝 Notas Técnicas

- **Versão atual do sistema**: v38
- **Última atualização**: 06/01/2026
- **Alterações recentes**:
  - Novo logotipo InfoShire com dragão verde
  - Fotos atualizadas na página Contato
  - Remoção de serviços de smartphones
  - Carrossel de avaliações Google
  - Cache busting agressivo implementado

---

## 🔄 Atualizações Automáticas

O sistema agora está configurado com:
- **cleanupOutdatedCaches**: true (limpa caches antigos automaticamente)
- **skipWaiting**: true (ativa nova versão imediatamente)
- **clientsClaim**: true (assume controle de todas as abas abertas)
- **NetworkFirst**: para imagens (sempre tenta buscar versão mais recente)

Isso significa que, após esta atualização, futuras mudanças devem aparecer automaticamente sem necessidade de limpar cache manualmente.
