# 🚀 Guia Rápido - Configuração de Email

## ⚡ 3 Passos Simples

### 1️⃣ Configure a Senha no Supabase
1. Acesse: https://supabase.com/dashboard
2. Selecione seu projeto
3. Vá em: **Settings** → **Edge Functions** → **Environment Variables**
4. Adicione:
   - **Name:** `SMTP_PASSWORD`
   - **Value:** Sua senha do Hotmail
5. Clique em **Save**

### 2️⃣ Configure no Painel Admin
1. Acesse: `/admin/email-settings`
2. Preencha:
   - **Email:** seu-email@hotmail.com
   - **Nome do Remetente:** Sua Empresa
   - **Email do Remetente:** seu-email@hotmail.com
3. Clique em **Salvar Configuração**

### 3️⃣ Teste
1. Digite um email para teste
2. Clique em **Enviar Teste**
3. ✅ Pronto!

---

## 🔐 Senha de Aplicativo (Recomendado)

Para maior segurança, use uma senha de aplicativo:

1. Acesse: https://account.microsoft.com/security
2. Vá em: **Segurança** → **Opções avançadas** → **Senhas de aplicativo**
3. Crie uma nova senha
4. Use essa senha no **Passo 1** acima

---

## ❌ Erros Comuns

| Erro | Solução |
|------|---------|
| "Senha SMTP não configurada" | Faça o **Passo 1** |
| "Configuração não encontrada" | Faça o **Passo 2** |
| "Erro ao autenticar" | Use senha de aplicativo |

---

## 📖 Documentação Completa

Veja o arquivo `CONFIGURACAO_EMAIL.md` para instruções detalhadas.
