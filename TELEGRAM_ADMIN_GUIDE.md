# 🔐 Configuração do Token do Bot - Para o Administrador do Sistema

## Informações Importantes

O sistema está configurado para enviar notificações via Telegram quando um orçamento for aprovado. Para que isso funcione, você precisa configurar o **Token do Bot** como uma variável de ambiente segura no Supabase.

## O que o cliente precisa fazer:

### Passo 1: Criar o Bot no Telegram

O cliente deve:
1. Abrir o Telegram e buscar por `@BotFather`
2. Enviar o comando `/newbot`
3. Seguir as instruções para criar o bot
4. **COPIAR O TOKEN** fornecido pelo BotFather

### Passo 2: Obter o Chat ID

O cliente deve:
1. Buscar por `@userinfobot` no Telegram
2. Enviar qualquer mensagem
3. **COPIAR O CHAT ID** fornecido

### Passo 3: Iniciar conversa com o bot

O cliente deve:
1. Buscar o bot criado no Telegram
2. Clicar em "Iniciar" ou enviar `/start`

### Passo 4: Configurar no Painel Admin

O cliente pode fazer sozinho:
1. Acessar **Painel Admin → Configurações**
2. Rolar até **Notificações do Telegram**
3. Colar o Chat ID
4. Ativar as notificações
5. Salvar

## O que VOCÊ (administrador do sistema) precisa fazer:

### Configurar o Token do Bot no Supabase

**IMPORTANTE:** O cliente NÃO consegue fazer isso sozinho. Você precisa configurar o token como um Secret no Supabase.

#### Via Dashboard do Supabase:

1. Acesse: https://supabase.com/dashboard
2. Selecione o projeto do cliente
3. Vá em: **Project Settings** (ícone de engrenagem)
4. Clique em: **Edge Functions** no menu lateral
5. Role até a seção **Secrets**
6. Clique em **Add new secret**
7. Preencha:
   - **Name:** `TELEGRAM_BOT_TOKEN`
   - **Value:** [Cole o token fornecido pelo cliente]
8. Clique em **Save**

#### Via Supabase CLI (alternativa):

```bash
supabase secrets set TELEGRAM_BOT_TOKEN="token_fornecido_pelo_cliente"
```

## Exemplo de Token

O token do bot tem este formato:
```
123456789:ABCdefGHIjklMNOpqrsTUVwxyz-1234567890
```

## Segurança

⚠️ **NUNCA** compartilhe o token publicamente  
⚠️ **NUNCA** commite o token no código  
⚠️ O token deve ser armazenado APENAS como Secret no Supabase  

## Testando

Após configurar:
1. O cliente deve fazer login no sistema
2. Aprovar um orçamento de teste
3. Verificar se recebeu a mensagem no Telegram

## Mensagem de Exemplo

O cliente receberá mensagens assim:

```
🎉 ORÇAMENTO APROVADO!

📋 OS: #12345
👤 Cliente: João Silva
🔧 Equipamento: Notebook Dell Inspiron

💰 Valores:
• Mão de Obra: R$ 150,00
• Peças: R$ 250,00
• Total: R$ 400,00

✅ O cliente aprovou o orçamento e o reparo pode ser iniciado!
```

## Solução de Problemas

### Cliente não recebe mensagens

1. Verificar se o token está configurado corretamente no Supabase
2. Verificar se o cliente iniciou conversa com o bot (`/start`)
3. Verificar se o Chat ID está correto
4. Verificar se as notificações estão ativadas no painel

### Erro "Unauthorized"

O token está incorreto ou não foi configurado. Verifique o Secret no Supabase.

### Erro "Chat not found"

O cliente não iniciou conversa com o bot. Ele precisa buscar o bot no Telegram e enviar `/start`.

## Arquivos de Documentação para o Cliente

Envie estes arquivos para o cliente:
- `TELEGRAM_QUICKSTART.md` - Guia rápido de 5 minutos
- `TELEGRAM_SETUP.md` - Guia completo e detalhado

---

**Data:** Janeiro 2026  
**Edge Function:** `send-telegram-notification`  
**Secret Name:** `TELEGRAM_BOT_TOKEN`
