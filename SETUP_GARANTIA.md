# Guia Rápido de Configuração - Módulo de Garantia

## 1. Configuração do Telegram (Obrigatório para Notificações)

### Passo 1: Criar Bot no Telegram
1. Abra o Telegram e busque por `@BotFather`
2. Envie o comando `/newbot`
3. Siga as instruções e escolha um nome para o bot
4. Copie o **token** fornecido (formato: `123456789:ABCdefGHIjklMNOpqrsTUVwxyz`)

### Passo 2: Obter Chat ID
1. Adicione o bot criado em um grupo ou chat
2. Envie uma mensagem qualquer para o bot
3. Acesse: `https://api.telegram.org/bot[SEU_TOKEN]/getUpdates`
4. Procure por `"chat":{"id":` e copie o número (pode ser negativo)

### Passo 3: Configurar no Supabase
1. Acesse o painel do Supabase
2. Vá em **Settings** > **Edge Functions** > **Secrets**
3. Adicione um novo secret:
   - **Name:** `TELEGRAM_BOT_TOKEN`
   - **Value:** Cole o token do bot

### Passo 4: Configurar no Sistema
1. Faça login como admin no sistema
2. Vá em **Configurações** > **Telegram**
3. Cole o **Chat ID** obtido no passo 2
4. Ative as **Notificações do Telegram**
5. Salve as configurações

## 2. Configuração do Cron Job (Verificação Automática Diária)

### Opção A: Via Supabase Dashboard (Recomendado)

1. Acesse o painel do Supabase
2. Vá em **Database** > **Extensions**
3. Ative a extensão `pg_cron` se não estiver ativa
4. Vá em **SQL Editor**
5. Execute o seguinte SQL:

```sql
-- Criar cron job para verificação diária de garantias às 9h
SELECT cron.schedule(
  'check-warranties-daily',
  '0 9 * * *', -- Todo dia às 9h (horário UTC)
  $$
  SELECT net.http_post(
    url := 'https://[SEU_PROJETO_ID].supabase.co/functions/v1/check-warranties',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer [SUA_ANON_KEY]'
    ),
    body := '{}'::jsonb
  );
  $$
);
```

**Importante:** Substitua:
- `[SEU_PROJETO_ID]` pelo ID do seu projeto Supabase
- `[SUA_ANON_KEY]` pela chave anon do seu projeto

6. Para verificar se o cron foi criado:
```sql
SELECT * FROM cron.job;
```

7. Para remover o cron (se necessário):
```sql
SELECT cron.unschedule('check-warranties-daily');
```

### Opção B: Executar Manualmente

Se preferir executar manualmente ou via outro sistema de agendamento:

1. No sistema, crie um botão admin para executar manualmente
2. Ou use a API diretamente:

```bash
curl -X POST \
  https://[SEU_PROJETO_ID].supabase.co/functions/v1/check-warranties \
  -H "Authorization: Bearer [SUA_ANON_KEY]" \
  -H "Content-Type: application/json" \
  -d '{}'
```

## 3. Ajustar Horário do Cron

O horário no cron é em **UTC**. Para ajustar para seu fuso horário:

- **Brasil (GMT-3):** Para executar às 9h no Brasil, use `0 12 * * *` (12h UTC = 9h Brasil)
- **Portugal (GMT+0):** Para executar às 9h em Portugal, use `0 9 * * *`

Formato do cron: `minuto hora dia mês dia_da_semana`

Exemplos:
- `0 9 * * *` - Todo dia às 9h
- `0 9 * * 1-5` - Segunda a sexta às 9h
- `0 9,18 * * *` - Todo dia às 9h e 18h
- `0 */6 * * *` - A cada 6 horas

## 4. Testar a Configuração

### Teste 1: Verificar Edge Function
```bash
curl -X POST \
  https://[SEU_PROJETO_ID].supabase.co/functions/v1/check-warranties \
  -H "Authorization: Bearer [SUA_ANON_KEY]" \
  -H "Content-Type: application/json" \
  -d '{}'
```

Resposta esperada:
```json
{
  "success": true,
  "message": "Verificação de garantias concluída",
  "expired_count": 0,
  "expiring_soon_count": 0,
  "expired_warranties": [],
  "expiring_soon": []
}
```

### Teste 2: Criar OS de Teste
1. Crie uma nova OS
2. Marque como "Pronto para retirada"
3. Verifique se `data_conclusao` e `data_fim_garantia` foram preenchidos
4. Acesse "Garantias Ativas" e veja se a OS aparece

### Teste 3: Verificar Notificação Telegram
1. Execute a edge function manualmente (via curl ou botão admin)
2. Verifique se recebeu mensagem no Telegram
3. Se não recebeu, verifique:
   - Token do bot está correto
   - Chat ID está correto
   - Notificações estão ativadas nas configurações
   - Bot foi adicionado ao grupo/chat

## 5. Monitoramento

### Ver Logs da Edge Function
1. Acesse o painel do Supabase
2. Vá em **Edge Functions** > **check-warranties**
3. Clique em **Logs**
4. Veja execuções recentes e possíveis erros

### Ver Execuções do Cron
```sql
SELECT * FROM cron.job_run_details 
WHERE jobid = (SELECT jobid FROM cron.job WHERE jobname = 'check-warranties-daily')
ORDER BY start_time DESC 
LIMIT 10;
```

## 6. Troubleshooting

### Problema: Notificações não chegam
**Solução:**
1. Verifique se o token do bot está correto
2. Verifique se o Chat ID está correto (pode ser negativo)
3. Certifique-se de que o bot foi adicionado ao grupo/chat
4. Verifique se as notificações estão ativadas nas configurações do sistema

### Problema: Cron não executa
**Solução:**
1. Verifique se a extensão `pg_cron` está ativa
2. Verifique se o cron foi criado: `SELECT * FROM cron.job;`
3. Verifique logs de erro: `SELECT * FROM cron.job_run_details WHERE status = 'failed';`
4. Certifique-se de que a URL e a chave estão corretas

### Problema: Garantias não são calculadas automaticamente
**Solução:**
1. Verifique se a migration foi aplicada
2. Verifique se os triggers estão ativos:
```sql
SELECT * FROM pg_trigger WHERE tgname LIKE '%warranty%';
```
3. Teste manualmente atualizando uma OS para status 'completed'

## 7. Próximos Passos

Após configurar tudo:

1. ✅ Teste criar uma OS e marcar como finalizada
2. ✅ Verifique se a garantia foi calculada
3. ✅ Acesse "Buscar Garantia" e teste a busca
4. ✅ Acesse "Garantias Ativas" e veja a listagem
5. ✅ Execute a verificação manual e veja se recebe notificação
6. ✅ Aguarde a execução automática do cron no horário configurado

## 8. Suporte

Para mais detalhes, consulte o arquivo `MODULO_GARANTIA.md` que contém:
- Documentação completa de todas as funcionalidades
- Exemplos de código
- Fluxos de funcionamento detalhados
- Guia de manutenção e extensão
