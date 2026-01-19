# 🚀 Guia Rápido: Configurar Diagnóstico Assistido por IA

## ⚡ Setup em 5 Minutos

### 1️⃣ Obter OpenAI API Key
1. Acesse: https://platform.openai.com/api-keys
2. Faça login ou crie uma conta
3. Clique em "Create new secret key"
4. Copie a chave (começa com `sk-proj-...`)
5. **IMPORTANTE:** Guarde em local seguro (não será mostrada novamente)

### 2️⃣ Configurar Billing na OpenAI
1. Acesse: https://platform.openai.com/account/billing
2. Adicione método de pagamento (cartão de crédito)
3. Defina limite de gasto (sugestão: $10/mês)
4. **Custo estimado:** ~$0.0008 por diagnóstico (R$ 0,004)

### 3️⃣ Adicionar Secret no Supabase

#### Opção A: Via Dashboard (Recomendado)
1. Acesse: https://supabase.com/dashboard
2. Selecione seu projeto
3. Vá em: **Edge Functions** > **Secrets**
4. Clique em **Add Secret**
5. Preencha:
   - **Name:** `OPENAI_API_KEY`
   - **Value:** `sk-proj-...` (sua chave)
6. Clique em **Save**

#### Opção B: Via CLI
```bash
# Instalar Supabase CLI (se não tiver)
npm install -g supabase

# Login
supabase login

# Adicionar secret
supabase secrets set OPENAI_API_KEY=sk-proj-...
```

### 4️⃣ Testar o Diagnóstico
1. Acesse uma ordem de serviço no admin
2. Clique no botão **"Diagnóstico IA"**
3. Digite uma descrição do problema (mínimo 10 caracteres)
4. Aguarde 2 segundos após parar de digitar
5. Veja as sugestões aparecerem! 🎉

---

## ✅ Verificar se Está Funcionando

### Teste Rápido
1. Crie ou abra uma OS
2. Descrição do problema: "Console não liga, LED vermelho piscando"
3. Equipamento: "Xbox One"
4. Clique em "Diagnóstico IA"
5. Deve aparecer:
   - ✅ Loading (2-5 segundos)
   - ✅ Possíveis causas com probabilidade
   - ✅ Testes rápidos
   - ✅ Risco de retorno
   - ✅ Peças comuns
   - ✅ Estimativas de tempo e custo

### Se Não Funcionar
1. **Erro: "OpenAI API key not configured"**
   - Verifique se adicionou o secret corretamente
   - Nome deve ser exatamente: `OPENAI_API_KEY`
   - Redeploy a função: `supabase functions deploy ai-diagnostic`

2. **Erro: "Failed to get AI diagnosis"**
   - Verifique billing na OpenAI
   - Verifique se tem créditos disponíveis
   - Veja logs: `supabase functions logs ai-diagnostic`

3. **Diagnóstico não aparece**
   - Digite pelo menos 10 caracteres
   - Aguarde 2 segundos após parar de digitar
   - Verifique console do navegador (F12)

---

## 💰 Custos

### OpenAI API (GPT-4o-mini)
- **Input:** $0.15 / 1M tokens
- **Output:** $0.60 / 1M tokens
- **Média por diagnóstico:** ~1000 tokens = **$0.0008** (R$ 0,004)

### Exemplos de Uso
| Diagnósticos/Mês | Custo USD | Custo BRL (R$ 5,00) |
|------------------|-----------|---------------------|
| 100              | $0.08     | R$ 0,40             |
| 500              | $0.40     | R$ 2,00             |
| 1.000            | $0.80     | R$ 4,00             |
| 5.000            | $4.00     | R$ 20,00            |

**Conclusão:** Custo extremamente baixo para o valor agregado!

---

## 🎯 Dicas de Uso

### Para Melhores Resultados
1. **Seja específico na descrição:**
   - ❌ "Não funciona"
   - ✅ "Console não liga, LED vermelho piscando 3 vezes, sem vídeo"

2. **Inclua sintomas observáveis:**
   - LEDs (cor, padrão de piscar)
   - Sons (bips, cliques, ruídos)
   - Comportamento (liga e desliga, trava, etc.)

3. **Use o histórico a seu favor:**
   - Quanto mais OS você registrar, melhor a IA fica
   - Sistema aprende com padrões da sua assistência

### Quando Usar
- ✅ Diagnóstico inicial rápido
- ✅ Confirmar suspeitas
- ✅ Identificar causas menos óbvias
- ✅ Estimar tempo e custo
- ✅ Planejar compra de peças

### Quando NÃO Confiar Cegamente
- ⚠️ Problemas muito raros/específicos
- ⚠️ Equipamentos novos sem histórico
- ⚠️ Sintomas contraditórios
- ⚠️ **SEMPRE confirme com testes físicos!**

---

## 📞 Suporte

### Problemas Comuns

**1. "Diagnóstico muito genérico"**
- Seja mais específico na descrição
- Inclua mais detalhes (LEDs, sons, comportamento)
- Continue usando (melhora com mais dados)

**2. "Demora muito para responder"**
- Normal: 2-5 segundos
- Se > 10 segundos: verifique internet
- Veja logs: `supabase functions logs ai-diagnostic`

**3. "Sugestões não fazem sentido"**
- Verifique se descrição está clara
- Confirme equipamento correto
- Reporte para melhorar o prompt

### Logs e Debug
```bash
# Ver logs da Edge Function
supabase functions logs ai-diagnostic --follow

# Ver últimos erros
supabase functions logs ai-diagnostic | grep ERROR

# Testar Edge Function diretamente
curl -X POST https://[project-ref].supabase.co/functions/v1/ai-diagnostic \
  -H "Authorization: Bearer [anon-key]" \
  -H "Content-Type: application/json" \
  -d '{
    "problem_description": "Console não liga",
    "equipment": "Xbox One"
  }'
```

---

## 🎉 Pronto!

Seu sistema agora tem diagnóstico assistido por IA! 🧠✨

**Próximos Passos:**
1. Teste com ordens reais
2. Colete feedback dos técnicos
3. Ajuste o prompt se necessário
4. Monitore custos mensais
5. Aproveite a produtividade! 🚀

---

**Documentação Completa:** Veja `AI_DIAGNOSTIC_MODULE.md` para detalhes técnicos, casos de uso e troubleshooting avançado.
