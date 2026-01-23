# 🚀 Quick Start - Debug Panel & Offline-First Queue

## 📍 Acessar o Debug Panel

1. Acesse: `http://localhost:5173/#/admin/debug` (ou URL do seu admin)
2. Ou navegue: Admin Dashboard → (em desenvolvimento, será adicionado menu link)

---

## 📊 O Que Você Vai Ver

### Stats Cards (Top)
- **Total de operações:** Todas as OSs enfileiradas
- **Pendentes/Enviando:** OSs que ainda não foram criadas (amarelo)
- **Concluídas:** OSs criadas com sucesso (verde)
- **Erros:** OSs que falharam (vermelho)

### Operações Pendentes (Middle Section)

Cada operação mostra:
- **Status colorido:** 
  - ⚫ Pendente (cinza)
  - 🔵 Enviando (azul)
  - 🟢 Concluído (verde)
  - 🔴 Erro (vermelho)
  - 🟡 Parcial (amarelo)
- **opId:** ID único para rastreamento
- **OS #:** Número da ordem de serviço
- **Tentativas:** Quantas vezes foi tentada

### Expandir Operação (Clique no ▼)

Detalhes completos:
- **Criada em:** Data/hora que foi enfileirada
- **Última tentativa:** Quando foi a última tentativa de envio
- **Último erro:** Se houver erro, qual foi
- **Payload:** Os dados completos da OS (JSON)
- **Timeline:** Histórico de eventos (enqueue, retry, success, error)

### Timeline de Eventos (Bottom Section)

Últimos 50 eventos do sistema:
- **Tempo:** HH:mm:ss.SSS
- **Tipo de evento:** `enqueue_start`, `send_success`, `retry_scheduled`, etc.
- **Dados:** Contexto do evento

---

## 🎮 Controles

### Atualizar
Carrega os dados mais recentes manualmente

### Auto ON/OFF
- **ON:** Atualiza automaticamente a cada 2 segundos
- **OFF:** Pausa auto-refresh (útil para ler dados sem movimento)

### Forçar Processamento
Dispara a fila imediatamente:
- Útil se vir operações "pendentes" que não estão progredindo
- Tenta enviar todas as operações enfileiradas
- Usa retry agressivo (retry em 0s, 0.5s, 1s, 2s, 4s)

### Limpar Tudo
❌ **DEV MODE ONLY** - Remove todas as operações enfileiradas
- Cuidado: perderá ordem que ainda não foi enviada
- Use apenas para limpar fila em desenvolvimento

### Delete (🗑️ ícone em cada operação)
Remove uma operação específica da fila

---

## 💡 Fluxo de Uso Típico

### Cenário 1: Admin cria OS com internet normal
```
1. Admin clica "Confirmar OS"
2. Toast: "OS em envio - pode trocar de aba" (não-bloqueante) ✅
3. Admin continua trabalhando
4. Debug panel mostra op com status "enviando" (azul) 
5. Em ~1 segundo: status muda para "concluído" (verde) ✅
```

### Cenário 2: Admin cria OS com internet instável
```
1. Admin clica "Confirmar OS"
2. Toast: "OS em envio - pode trocar de aba"
3. Operação enfileirada no IndexedDB
4. Debug panel mostra op "pendente" (cinza)
5. Quando internet volta: auto-retry dispara
6. Status: "enviando" (azul) → "concluído" (verde) ✅
```

### Cenário 3: Admin muda de aba durante criação
```
1. Admin clica "Confirmar OS"
2. Toast aparece, UI volta
3. Admin troca para outra aba
4. Ao retornar para aba original:
   - Auto-trigger de "focus" dispara
   - Fila processa com retry agressivo
5. OS criada com sucesso ✅
6. Debug panel mostra status "concluído"
```

### Cenário 4: Browser reinicia durante processamento
```
1. Admin cria OS
2. Browser reinicia por algum motivo
3. IndexedDB persiste a operação
4. Ao reabrir a página:
   - Auto-trigger de "app-start" dispara
   - Fila processa operações pendentes
5. OS criada com sucesso ✅
```

### Cenário 5: Fila parece travada
```
1. Debug panel mostra operação com status "pendente"
2. Há muito tempo já
3. Ação: Clique "Forçar Processamento"
4. Fila tenta novamente com retry agressivo
5. Se sucesso: status → "concluído" ✅
6. Se falha: status → "erro" + "Último erro" mostra o problema
```

---

## 🔍 Troubleshooting

### Problema: "Operação fica em 'pendente' por muito tempo"
**Causas possíveis:**
- Internet desconectada
- Servidor Supabase fora
- Bug na fila

**Solução:**
1. Verifique internet (deve estar online ✅)
2. Teste conectividade: abra console, digite `navigator.onLine` → deve ser `true`
3. Clique "Forçar Processamento"
4. Se ainda não funcionar: veja "Último erro" expandindo a op

### Problema: "Aparece 'erro' na fila"
**Ação:**
1. Expanda operação com erro
2. Leia "Último erro:" mensagem
3. Erros comuns:
   - `Sem internet` → Conecte à internet
   - `Sessão expirada` → Faça logout/login novamente
   - `Validation error: ...` → Revise dados da OS

### Problema: "Total nunca diminui"
**Causas possíveis:**
- Auto-refresh desligado (clique "Auto ON")
- Fila não processou (clique "Forçar Processamento")

### Problema: "Vejo operações criadas há horas em 'concluído'"
**Normal!** Operações completadas ficam no histórico para auditoria. 
- Para limpar: clique 🗑️ em cada uma, ou "Limpar Tudo" (DEV only)

---

## 📊 Timeline de Eventos - O Que Significa

### Event Types Comuns

| Evento | Significado |
|--------|------------|
| `enqueue_start` | OS começou a ser enfileirada |
| `enqueue_done` | OS foi enfileirada com sucesso |
| `process_start` | Fila começou a processar |
| `process_done` | Processamento terminou |
| `send_start` | Tentativa de envio começou |
| `send_success` | Ordem criada com sucesso no backend ✅ |
| `send_error` | Tentativa de envio falhou |
| `retry_scheduled` | Fila agendou retry automático |
| `clear_all_pending` | Admin clicou "Limpar Tudo" |
| `delete_op` | Admin deletou uma operação |
| `force_process_start` | Admin clicou "Forçar Processamento" |

### Lendo a Timeline
```
14:23:42.120 - enqueue_start (OS #12345 começa)
14:23:42.350 - enqueue_done (Enfileirada com sucesso)
14:23:42.360 - process_start (Fila detectou e iniciou)
14:23:43.100 - send_start (HTTP POST indo)
14:23:44.200 - send_success (✅ Ordem criada!)
```

---

## 🔗 Integração com Fluxo de Admin

### Durante Criação de OS
1. Admin preenche formulário de OS
2. Admin clica "Confirmar OS"
3. **Sistema:** Enfileira no IndexedDB
4. **Admin vê:** Toast "OS em envio - pode trocar de aba"
5. **Admin pode:** Trocar aba, criar outra OS, etc.
6. **Debug panel (opcional):** Ver status em tempo real

### Sem Necessidade de Abrir Debug Panel
- 99% dos casos: funciona silenciosamente
- Toast notifica quando está sendo enviado
- Admin não precisa fazer nada

### Quando Abrir Debug Panel
- Suspeitar que OS não foi criada
- Testar com internet instável
- Depurar timeout issues
- Verificar histórico de operações

---

## ⚙️ Configuração (Developers)

### Variáveis Ajustáveis em `queueProcessor.ts`
```typescript
const MIN_PROCESS_INTERVAL = 1000;  // Mínimo entre processamentos (ms)

function getRetryDelay(attempt: number, reason: ProcessReason) {
  const isAggressive = ['focus', 'visibility', 'online'].includes(reason);
  
  if (isAggressive) {
    // Retry rápido: 0s, 0.5s, 1s, 2s, 4s
    return Math.min(Math.pow(2, attempt - 1) * 250, 4000);
  }
  
  // Normal backoff: 1s, 2s, 4s, 8s
  return Math.min(Math.pow(2, attempt) * 1000, 30000);
}

async function shouldRetry(op: PendingOp, maxRetries = 5) {
  // Máximo 5 tentativas antes de desistir
}
```

### Concorrência
- Max 3 operações processadas em paralelo
- Aumentar para 5: altere `MAX_CONCURRENT = 5` em `queueProcessor.ts`

---

## 📚 Mais Informações

- **Documentação completa:** Ver `OFFLINE_FIRST_QUEUE_IMPLEMENTATION.md`
- **Código:** 
  - `src/services/pendingOps.ts` - IndexedDB store
  - `src/services/queueProcessor.ts` - Processador
  - `src/services/debugLogger.ts` - Telemetria
  - `src/pages/admin/AdminDebug.tsx` - UI do panel

---

## ✅ Checklist - Depois de Fazer Deploy

- [ ] Acessar `/admin/debug` e criar uma OS
- [ ] Verificar que operação apareça no panel
- [ ] Verificar que status mude para "concluído"
- [ ] Testar com internet desligada (será "pendente")
- [ ] Reconectar internet (deve processar auto)
- [ ] Testar forçar processamento manualmente
- [ ] Ler timeline de eventos para validar fluxo

---

*Last Updated: 2024 - Offline-First Queue System v1.0*
