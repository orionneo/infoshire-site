# 🤖 Guia Rápido - Configurar Bot do Telegram

## ⚡ Configuração Rápida (5 minutos)

### 1️⃣ Criar o Bot

1. Abra o Telegram
2. Busque: `@BotFather`
3. Envie: `/newbot`
4. Nome do bot: `InfoShire Notificações` (ou qualquer nome)
5. Username: `infoshire_bot` (ou qualquer nome terminando com `_bot`)
6. **COPIE O TOKEN** que aparece (exemplo: `123456789:ABCdef...`)

### 2️⃣ Pegar seu Chat ID

1. Busque: `@userinfobot`
2. Envie qualquer mensagem
3. **COPIE O NÚMERO** que aparece como "Id" (exemplo: `987654321`)

### 3️⃣ Iniciar conversa com seu bot

1. Busque o bot que você criou (exemplo: `@infoshire_bot`)
2. Clique em **Iniciar** ou envie `/start`

### 4️⃣ Configurar no Sistema

1. Acesse: **Painel Admin → Configurações**
2. Role até **Notificações do Telegram**
3. Cole o **Chat ID** no campo
4. Ative o **switch**
5. Clique em **Salvar**

### 5️⃣ Configurar o Token (IMPORTANTE!)

**O token precisa ser configurado no Supabase:**

1. Acesse: https://supabase.com/dashboard
2. Selecione seu projeto
3. Vá em: **Project Settings** → **Edge Functions** → **Secrets**
4. Clique em **Add new secret**
5. Nome: `TELEGRAM_BOT_TOKEN`
6. Valor: Cole o token do passo 1
7. Salve

## ✅ Pronto!

Agora quando um cliente aprovar um orçamento, você receberá uma mensagem assim:

```
🎉 ORÇAMENTO APROVADO!

📋 OS: #12345
👤 Cliente: João Silva
🔧 Equipamento: Notebook Dell

💰 Valores:
• Mão de Obra: R$ 150,00
• Peças: R$ 250,00
• Total: R$ 400,00

✅ O cliente aprovou o orçamento!
```

## 🆘 Não está funcionando?

1. ✅ Você iniciou conversa com o bot? (envie `/start`)
2. ✅ O Chat ID está correto?
3. ✅ O token foi configurado no Supabase?
4. ✅ As notificações estão ativadas no painel?

---

**Dúvidas?** Consulte o arquivo `TELEGRAM_SETUP.md` para instruções detalhadas.
