# 🚀 Guia Rápido - Solução de Problemas de Conexão

## ✅ O Que Foi Corrigido

### 1. SSL e HTTPS
- ✅ Conversão automática HTTP → HTTPS
- ✅ Meta tag `upgrade-insecure-requests`
- ✅ Validação de URL segura

### 2. Monitoramento
- ✅ Alerta visual de conexão (canto inferior direito)
- ✅ Verificação automática a cada 30s
- ✅ Medição de latência

### 3. Erros
- ✅ Mensagens específicas por tipo
- ✅ Retry automático (3 tentativas)
- ✅ Logs detalhados

---

## 🎯 Como Usar

### Alertas Visuais

**Nenhum alerta = Tudo OK** ✅

**"Sem conexão"** 🔴
- Verifique sua internet
- Sistema reconecta automaticamente

**"Erro de conexão"** ⚠️
- Clique em "Tentar novamente"
- Verifique firewall/VPN

**"Conexão lenta"** 🟡
- Latência > 3000ms
- Sistema funciona, mas mais devagar

**"Verificando conexão..."** 🔵
- Aguarde alguns segundos

---

## 🔧 Solução Rápida

### Problema: Site não carrega

1. **Limpe o cache:**
   - Ctrl+Shift+Del
   - Selecione "Todo o período"
   - Marque: Cookies + Cache

2. **Recarregue:**
   - Ctrl+Shift+R (hard reload)

3. **Teste em modo anônimo:**
   - Ctrl+Shift+N

### Problema: Erro de SSL

✅ **JÁ CORRIGIDO AUTOMATICAMENTE**
- Sistema força HTTPS
- Não precisa fazer nada

### Problema: "Failed to fetch"

1. Desative extensões do navegador
2. Desative VPN/proxy
3. Aguarde retry automático (3x)

---

## 📊 Console do Navegador

Abra DevTools (F12) e procure:

**✅ Sucesso:**
```
✅ Supabase inicializado com sucesso
🔗 URL: https://zbzrlncqjihswjzhoiqp.supabase.co
```

**❌ Erro:**
```
❌ Erro: Variáveis de ambiente não configuradas
```
→ Verifique arquivo `.env`

---

## 🛠️ Ferramentas Disponíveis

### Verificação Manual (Console)
```javascript
// Importar no console do navegador
import { checkSupabaseConnection } from '@/lib/network-check';
await checkSupabaseConnection();
```

### Retry Manual
```javascript
import { retryRequest } from '@/lib/network-check';
await retryRequest(() => minhaFuncao(), 3, 1000);
```

---

## 📱 Compatibilidade

✅ Chrome/Edge 90+
✅ Firefox 88+
✅ Safari 14+
✅ Navegadores móveis

---

## 🆘 Ainda com Problemas?

### Checklist:
- [ ] Internet funcionando?
- [ ] Cache limpo?
- [ ] Testou em modo anônimo?
- [ ] Testou em outro navegador?
- [ ] Testou em outra rede?

### Informações para Suporte:
1. Navegador e versão
2. Sistema operacional
3. Mensagem de erro completa (Console F12)
4. Captura de tela do alerta

---

## 📝 Arquivos Importantes

- `src/db/supabase.ts` - Configuração
- `src/lib/network-check.ts` - Utilitários
- `src/components/ConnectionStatus.tsx` - Alertas
- `.env` - Variáveis de ambiente

---

## 🔐 Variáveis de Ambiente

Verifique se estão configuradas:

```env
VITE_SUPABASE_URL=https://...supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGc...
```

⚠️ **IMPORTANTE:** URL deve começar com `https://`

---

**Versão:** 1.0.0 | **Data:** 2026-01-04
