# Configuração do Bot do Telegram - Guia Completo

Este guia explica como configurar o bot do Telegram para receber notificações quando um cliente aprovar um orçamento.

## Passo 1: Criar o Bot no Telegram

1. Abra o Telegram no seu celular ou computador
2. Busque por `@BotFather` (é o bot oficial do Telegram para criar bots)
3. Inicie uma conversa e envie o comando: `/newbot`
4. O BotFather vai pedir um nome para o bot. Exemplo: `InfoShire Notificações`
5. Depois, ele vai pedir um username (deve terminar com "bot"). Exemplo: `infoshire_notificacoes_bot`
6. O BotFather vai enviar uma mensagem com o **TOKEN** do bot. **GUARDE ESTE TOKEN!**
   - Exemplo de token: `123456789:ABCdefGHIjklMNOpqrsTUVwxyz`

## Passo 2: Descobrir seu Chat ID

1. Busque por `@userinfobot` no Telegram
2. Inicie uma conversa e envie qualquer mensagem (pode ser "oi")
3. O bot vai responder com suas informações, incluindo o **Chat ID**
4. Copie o número do Chat ID (exemplo: `987654321`)

## Passo 3: Iniciar conversa com seu bot

**IMPORTANTE:** Você precisa iniciar uma conversa com o bot que você criou antes de receber mensagens!

1. Busque pelo username do seu bot no Telegram (exemplo: `@infoshire_notificacoes_bot`)
2. Clique em "Iniciar" ou envie qualquer mensagem (pode ser `/start`)
3. Agora o bot pode enviar mensagens para você!

## Passo 4: Configurar no Sistema

1. Acesse o painel administrativo
2. Vá em **Configurações** (menu lateral)
3. Role até a seção **Notificações do Telegram**
4. Cole o **Chat ID** no campo correspondente
5. Ative o switch **Ativar Notificações**
6. Clique em **Salvar Configurações**

## Passo 5: Configurar o Token do Bot (Supabase Secret)

O token do bot precisa ser configurado como uma variável de ambiente segura no Supabase:

### Opção A: Via Dashboard do Supabase (Recomendado)

1. Acesse o [Dashboard do Supabase](https://supabase.com/dashboard)
2. Selecione seu projeto
3. Vá em **Project Settings** (ícone de engrenagem no menu lateral)
4. Clique em **Edge Functions** no menu lateral
5. Role até a seção **Secrets**
6. Clique em **Add new secret**
7. Nome: `TELEGRAM_BOT_TOKEN`
8. Valor: Cole o token que você recebeu do BotFather (exemplo: `123456789:ABCdefGHIjklMNOpqrsTUVwxyz`)
9. Clique em **Save**

### Opção B: Via Supabase CLI (Para desenvolvedores)

Se você tem acesso ao Supabase CLI, pode configurar o secret com o comando:

```bash
supabase secrets set TELEGRAM_BOT_TOKEN="seu_token_aqui"
```

## Testando a Configuração

1. Faça login como um cliente no sistema
2. Acesse uma ordem de serviço que tenha orçamento pendente
3. Aprove o orçamento
4. Você deve receber uma mensagem no Telegram com os detalhes da aprovação!

## Exemplo de Mensagem que Você Receberá

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

### Não estou recebendo mensagens

1. **Verifique se você iniciou conversa com o bot**
   - Busque o bot no Telegram e envie `/start`

2. **Verifique o Chat ID**
   - Confirme que o Chat ID está correto nas configurações
   - Use o `@userinfobot` para verificar seu Chat ID novamente

3. **Verifique se as notificações estão ativadas**
   - Vá em Configurações e confirme que o switch está ativado

4. **Verifique o token do bot**
   - Confirme que o token foi configurado corretamente no Supabase
   - O token deve estar no formato: `número:letras_e_números`

5. **Verifique os logs**
   - Acesse o console do navegador (F12) ao aprovar um orçamento
   - Procure por erros relacionados ao Telegram

### Erro "Chat not found"

Isso significa que você não iniciou conversa com o bot. Busque o bot no Telegram e envie `/start`.

### Erro "Unauthorized"

O token do bot está incorreto ou não foi configurado. Verifique o token no Supabase Secrets.

## Segurança

- **NUNCA** compartilhe o token do bot publicamente
- O token dá acesso total ao bot e permite enviar mensagens em seu nome
- Se o token vazar, revogue-o no BotFather com o comando `/revoke` e crie um novo bot

## Vantagens do Telegram

✅ **Gratuito** - Sem custos de SMS ou WhatsApp Business API  
✅ **Instantâneo** - Mensagens chegam em tempo real  
✅ **Confiável** - Infraestrutura robusta do Telegram  
✅ **Multiplataforma** - Funciona em celular, tablet e computador  
✅ **Notificações push** - Você é alertado mesmo com o app fechado  

## Suporte

Se você tiver problemas para configurar, entre em contato com o suporte técnico com as seguintes informações:

- Print da tela de configurações do Telegram no sistema
- Print da conversa com o BotFather
- Mensagens de erro (se houver)

---

**Última atualização:** Janeiro 2026
