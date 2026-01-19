# 🐛 GUIA DE DEBUG - Sistema de IA

## 🔍 Como Verificar se Está Funcionando

### 1. Abrir Console do Navegador
- Pressionar **F12** (Windows/Linux) ou **Cmd+Option+I** (Mac)
- Ir para aba **Console**

### 2. Criar Nova Ordem de Serviço
- Ir para: **Admin → Nova Ordem de Serviço**
- Preencher equipamento: "Notebook Dell"
- Digitar descrição: "Bateria não carrega"
- Aguardar 1.5 segundos

### 3. Verificar Logs no Console

#### ✅ Logs de Sucesso (Esperado)
```javascript
Calling AI suggestions RPC function...
AI Suggestions RPC Response: {ok: true, mode: "OPEN_OS", suggestions: {...}}
Suggestions object: {organized_description: "Bateria não carrega", ...}
Clarification questions: (6) ["Qual é o problema...", "O equipamento liga?", ...]
Questions type: object
Questions length: 6
Question 0: Qual é o problema específico do equipamento? Type: string Length: 46
Question 1: O equipamento liga? Type: string Length: 20
Question 2: Quando o problema começou? Type: string Length: 28
Question 3: Há sinais de dano físico? Type: string Length: 27
Question 4: O problema ocorre sempre ou apenas às vezes? Type: string Length: 48
Question 5: O equipamento sofreu alguma queda ou contato com líquido? Type: string Length: 61
```

#### ❌ Logs de Erro (Não Deve Aparecer)
```javascript
// Erro JWT (JÁ CORRIGIDO)
Function Error: {"code":401,"message":"Invalid JWT"}

// Erro de campo (JÁ CORRIGIDO)
record "new" has no field "brand"

// Erro RPC
RPC function failed, trying Edge Function... {message: "..."}
```

### 4. Verificar Interface Visual

#### ✅ Aparência Correta
```
🧠 Sugestões IA [Beta] [X]
Sugestões inteligentes baseadas na descrição do problema

💡 Descrição Organizada                    [Aplicar]
┌─────────────────────────────────────────────────┐
│ Bateria não carrega                             │
└─────────────────────────────────────────────────┘

🏷️ Categoria Sugerida                      [Aplicar]
┌─────────────────────────────────────────────────┐
│ Energia                                         │
└─────────────────────────────────────────────────┘

☑️ Checklist Inicial                  [Adicionar (7)]
☑ Verificar se equipamento liga
☑ Testar botão de power
☑ Verificar sinais de curto-circuito
☑ Inspecionar placa-mãe
☑ Testar carregador
☑ Verificar porta de carga
☑ Medir tensão da bateria

❓ Perguntas de Clarificação
┌─────────────────────────────────────────────────┐
│ • Qual é o problema específico do equipamento?  │
│ • O equipamento liga?                           │
│ • Quando o problema começou?                    │
│ • Há sinais de dano físico?                     │
│ • O problema ocorre sempre ou apenas às vezes?  │
│ • O equipamento sofreu alguma queda ou contato  │
│   com líquido?                                  │
└─────────────────────────────────────────────────┘

💡 Dica: Todas as sugestões são editáveis...
```

#### ❌ Aparência Incorreta (NÃO DEVE APARECER)
```
❓ Perguntas de Clarificação
┌─────────────────────────────────────────────────┐
│ •                                               │
│ •                                               │
│ •                                               │
│ •                                               │
│ •                                               │
│ •                                               │
└─────────────────────────────────────────────────┘
```

## 🔧 Troubleshooting

### Problema 1: Perguntas Aparecem Vazias

#### Sintomas:
- Bullets (•) aparecem mas sem texto
- Console mostra: `Questions length: 6` mas perguntas vazias

#### Soluções:
1. **Recarregar página (F5)**
2. **Limpar cache:**
   - Chrome: Ctrl+Shift+Delete → Limpar cache
   - Firefox: Ctrl+Shift+Delete → Limpar cache
3. **Verificar logs:**
   - Abrir console (F12)
   - Procurar por "Question 0:", "Question 1:", etc.
   - Verificar se `Type: string` e `Length: > 0`
4. **Testar RPC diretamente:**
   ```sql
   SELECT get_ai_suggestions('Bateria não carrega', 'Notebook', NULL, NULL);
   ```

### Problema 2: Erro "record new has no field brand"

#### Sintomas:
- Erro vermelho na parte inferior da tela
- Console mostra: `record "new" has no field "brand"`
- Criação de OS falha

#### Soluções:
1. **Verificar se migration foi aplicada:**
   ```sql
   SELECT * FROM supabase_migrations.schema_migrations
   WHERE version LIKE '%fix_ai_knowledge_trigger%';
   ```
2. **Reaplicar migration manualmente:**
   - Ver arquivo: `CORRECAO_COMPLETA_IA_FUNCIONAL.md`
   - Seção: "Função SQL Atualizada"
3. **Verificar trigger:**
   ```sql
   SELECT pg_get_functiondef(oid)
   FROM pg_proc
   WHERE proname = 'capture_ai_knowledge_event';
   ```
   - Não deve conter `NEW.brand` ou `NEW.model`

### Problema 3: Erro JWT 401

#### Sintomas:
- Erro: `{"code":401,"message":"Invalid JWT"}`
- Sugestões não aparecem

#### Soluções:
1. **Recarregar página (F5)**
2. **Fazer login novamente**
3. **Verificar se RPC está sendo chamada:**
   - Console deve mostrar: "Calling AI suggestions RPC function..."
   - Se não aparecer, verificar código do componente
4. **Testar RPC diretamente no banco:**
   ```sql
   SELECT get_ai_suggestions('Teste', 'Notebook', NULL, NULL);
   ```

### Problema 4: Nenhuma Sugestão Aparece

#### Sintomas:
- Painel de IA não aparece
- Ou aparece mas vazio

#### Soluções:
1. **Verificar descrição do problema:**
   - Deve ter pelo menos 10 caracteres
   - Aguardar 1.5 segundos após digitar
2. **Verificar console:**
   - Deve mostrar "Calling AI suggestions RPC function..."
   - Deve mostrar "AI Suggestions RPC Response: ..."
3. **Verificar se IA está ativada:**
   - Componente deve ter `enabled={true}`
4. **Verificar termos no banco:**
   ```sql
   SELECT COUNT(*) FROM ai_terms;
   ```
   - Deve retornar 37 termos

## 📊 Comandos SQL Úteis

### Verificar Termos de IA
```sql
SELECT term, term_category, frequency
FROM ai_terms
ORDER BY frequency DESC
LIMIT 10;
```

### Verificar Eventos de Conhecimento
```sql
SELECT 
  id,
  equipamento_tipo,
  event_type,
  status,
  created_at
FROM ai_knowledge_events
ORDER BY created_at DESC
LIMIT 10;
```

### Verificar Erros de IA
```sql
SELECT 
  function_name,
  error_message,
  created_at
FROM ai_errors
ORDER BY created_at DESC
LIMIT 10;
```

### Testar RPC Function
```sql
-- Teste 1: Bateria
SELECT get_ai_suggestions('Bateria não carrega', 'Notebook', NULL, NULL);

-- Teste 2: Tela
SELECT get_ai_suggestions('Tela quebrada', 'iPhone', NULL, NULL);

-- Teste 3: Líquido
SELECT get_ai_suggestions('Derramou água', 'MacBook', NULL, NULL);

-- Teste 4: Queimado
SELECT get_ai_suggestions('Não liga e cheira queimado', 'PlayStation', NULL, NULL);
```

### Verificar Trigger
```sql
-- Ver definição do trigger
SELECT pg_get_functiondef(oid)
FROM pg_proc
WHERE proname = 'capture_ai_knowledge_event';

-- Verificar se trigger está ativo
SELECT 
  trigger_name,
  event_manipulation,
  action_statement
FROM information_schema.triggers
WHERE event_object_table = 'service_orders'
  AND trigger_name = 'trigger_capture_ai_knowledge';
```

## 🎯 Checklist de Validação

Use este checklist para verificar se tudo está funcionando:

- [ ] Console mostra "Calling AI suggestions RPC function..."
- [ ] Console mostra "AI Suggestions RPC Response: {ok: true, ...}"
- [ ] Console mostra "Questions length: 6"
- [ ] Console mostra "Question 0: ... Type: string Length: > 0"
- [ ] Interface mostra 6 perguntas COM TEXTO
- [ ] Interface mostra checklist com 4-7 itens
- [ ] Interface mostra categoria sugerida
- [ ] Botão "Aplicar" funciona
- [ ] Criação de OS funciona sem erros
- [ ] Sem erro "record new has no field brand"
- [ ] Sem erro JWT 401

Se todos os itens estiverem marcados: **✅ Sistema 100% funcional!**

## 📞 Suporte Técnico

Se precisar de ajuda:

1. **Copiar logs do console:**
   - Abrir console (F12)
   - Clicar com botão direito na área de logs
   - "Save as..." ou copiar tudo

2. **Tirar print da tela:**
   - Print da interface com erro
   - Print do console com logs

3. **Informações úteis:**
   - Navegador e versão
   - Sistema operacional
   - Descrição do problema digitada
   - Equipamento selecionado
   - Quando o erro ocorreu

4. **Enviar para suporte:**
   - Logs do console
   - Prints da tela
   - Informações acima

---

**Sistema testado e 100% funcional!** 🎉

**Última atualização:** 2026-01-15
