# Configuração de Email - Guia Completo

## 📧 Visão Geral

O sistema agora possui uma interface completa para configuração de email marketing e notificações. Você pode configurar seu email do Hotmail/Outlook diretamente pelo painel administrativo.

## 🚀 Como Configurar (Passo a Passo)

### Passo 1: Configure a Senha no Supabase (PRIMEIRO!)

⚠️ **IMPORTANTE:** Faça isso ANTES de configurar no painel!

1. Acesse o [Dashboard do Supabase](https://supabase.com/dashboard)
2. Selecione seu projeto
3. No menu lateral, vá em **Settings** (⚙️ ícone de engrenagem)
4. Clique em **Edge Functions**
5. Procure por **"Environment Variables"** ou **"Secrets"**
6. Clique em **"Add new secret"** ou **"New variable"**
7. Preencha:
   - **Name:** `SMTP_PASSWORD`
   - **Value:** Sua senha do Hotmail/Outlook (ou senha de aplicativo - recomendado)
8. Clique em **"Save"** ou **"Create"**

### Passo 2: Configure no Painel Administrativo

1. Faça login como administrador no sistema
2. No menu lateral, clique em **"Config. Email"**
3. Preencha o formulário com seus dados:

**Configurações para Hotmail/Outlook:**

- **Servidor SMTP:** `smtp-mail.outlook.com` (já vem preenchido)
- **Porta:** `587` (já vem preenchido)
- **Tipo de Segurança:** `TLS/STARTTLS` (já vem selecionado)
- **Email (Usuário SMTP):** Seu email completo (ex: `seu-email@hotmail.com`)
- **Senha:** Deixe em branco (a senha já está no Supabase)
- **Nome do Remetente:** Nome que aparecerá nos emails (ex: `Sua Empresa`)
- **Email do Remetente:** Geralmente o mesmo que o usuário SMTP

4. Clique em **"Salvar Configuração"**

### Passo 3: Teste a Configuração

1. Role até a seção **"Testar Configuração"**
2. Digite um email para teste (pode ser o seu próprio)
3. Clique em **"Enviar Teste"**
4. Verifique se recebeu o email de teste
5. ✅ Se recebeu, está tudo configurado!

## 🔐 Segurança - Senha de Aplicativo (RECOMENDADO)

Para maior segurança, use uma **Senha de Aplicativo** em vez da senha principal:

### Como criar uma Senha de Aplicativo no Hotmail/Outlook:

1. Acesse [account.microsoft.com/security](https://account.microsoft.com/security)
2. Faça login com sua conta
3. Vá em **Segurança** > **Opções de segurança avançadas**
4. Em **Verificação em duas etapas**, ative se ainda não estiver ativo
5. Role até **Senhas de aplicativo**
6. Clique em **Criar uma nova senha de aplicativo**
7. Dê um nome (ex: "InfoShire Email")
8. Copie a senha gerada (será algo como: `abcd-efgh-ijkl-mnop`)
9. Use essa senha no **Passo 1** acima (variável SMTP_PASSWORD)

## 📋 Checklist Rápido

Antes de usar o sistema de email, certifique-se de:

- [ ] ✅ Configurou a variável `SMTP_PASSWORD` no Supabase
- [ ] ✅ Preencheu o formulário em "Config. Email"
- [ ] ✅ Testou o envio de email
- [ ] ✅ Recebeu o email de teste com sucesso

## ❓ Problemas Comuns

### ❌ "Senha SMTP não configurada"
- **Causa:** Variável `SMTP_PASSWORD` não foi criada no Supabase
- **Solução:** Siga o **Passo 1** acima

### ❌ "Configuração de email não encontrada"
- **Causa:** Formulário não foi preenchido e salvo
- **Solução:** Siga o **Passo 2** acima

### ❌ "Erro ao autenticar" ou "Authentication failed"
- **Causa:** Senha incorreta ou autenticação de dois fatores ativa
- **Solução:** Use uma senha de aplicativo (veja seção de Segurança acima)

### ❌ "Conexão recusada"
- **Causa:** Servidor ou porta incorretos
- **Solução:** Verifique se está usando `smtp-mail.outlook.com` na porta `587`

### ❌ Email não chega
- **Causa:** Email pode estar na caixa de spam
- **Solução:** Verifique a pasta de spam do destinatário

## 🛠️ Configurações Técnicas

### Hotmail/Outlook SMTP:
```
Servidor: smtp-mail.outlook.com
Porta: 587
Segurança: TLS/STARTTLS
Autenticação: Obrigatória
```

### Alternativa (Office 365):
```
Servidor: smtp.office365.com
Porta: 587
Segurança: TLS/STARTTLS
Autenticação: Obrigatória
```

## 🎯 Funcionalidades Disponíveis

Após configurar o email, você poderá:

1. ✅ Enviar emails de marketing para clientes
2. ✅ Enviar notificações de orçamento
3. ✅ Enviar atualizações de status de ordens de serviço
4. ✅ Testar a configuração antes de usar

## 📞 Suporte

Se tiver dúvidas ou problemas:

1. Verifique se seguiu todos os passos na ordem correta
2. Certifique-se de que a variável `SMTP_PASSWORD` está configurada no Supabase
3. Teste com o botão "Enviar Teste"
4. Verifique os logs do Supabase Edge Functions se houver erros

## 🔄 Para Atualizar a Senha

Se precisar mudar a senha do email:

1. Acesse o Supabase Dashboard
2. Settings > Edge Functions > Environment Variables
3. Encontre a variável `SMTP_PASSWORD`
4. Clique em editar e atualize o valor
5. Salve as alterações

---

**Última atualização:** 2026-01-04
