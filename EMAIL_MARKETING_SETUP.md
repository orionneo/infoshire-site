# 📧 Guia Rápido: Configuração do Email Marketing

## ⚡ Setup em 5 Minutos

### Passo 1: Criar Conta no Resend

1. Acesse [resend.com](https://resend.com)
2. Clique em **"Sign Up"**
3. Crie sua conta (gratuita)

### Passo 2: Obter API Key

1. Faça login no Resend
2. Vá em **"API Keys"** no menu lateral
3. Clique em **"Create API Key"**
4. Dê um nome (ex: "InfoShire Production")
5. Copie a chave (começa com `re_`)

### Passo 3: Configurar no Supabase

#### Opção A: Via Dashboard (Recomendado)

1. Acesse seu projeto no [Supabase Dashboard](https://supabase.com/dashboard)
2. Vá em **Settings → Edge Functions**
3. Clique na aba **"Secrets"**
4. Clique em **"Add Secret"**
5. Preencha:
   - **Name**: `RESEND_API_KEY`
   - **Value**: Cole a chave copiada (ex: `re_123abc...`)
6. Clique em **"Save"**

#### Opção B: Via CLI

```bash
# Se você tem o Supabase CLI instalado
supabase secrets set RESEND_API_KEY=re_sua_chave_aqui
```

### Passo 4: Testar

1. Acesse o **Painel Admin** do seu sistema
2. Vá em **Email Marketing**
3. Componha um email de teste
4. Selecione apenas você como destinatário
5. Clique em **"Enviar Campanha"**
6. Verifique sua caixa de entrada (e spam)

---

## 🎯 Plano Gratuito do Resend

O plano gratuito inclui:
- ✅ **100 emails/dia**
- ✅ **3.000 emails/mês**
- ✅ API completa
- ✅ Sem cartão de crédito necessário

Perfeito para começar! 🚀

---

## 🔧 Verificar se Está Funcionando

### Teste Rápido

1. Envie um email de teste para você mesmo
2. Se receber → ✅ **Tudo certo!**
3. Se não receber:
   - Verifique spam/lixo eletrônico
   - Confirme que a API Key está correta
   - Veja os logs da Edge Function

### Ver Logs de Erro

```bash
# Via Supabase Dashboard
Edge Functions → send-email-campaign → Logs

# Ou via CLI
supabase functions logs send-email-campaign
```

---

## ⚠️ Problemas Comuns

### "Serviço de email não configurado"
**Solução**: Configure a `RESEND_API_KEY` nas secrets

### "API Key inválida"
**Solução**: 
1. Verifique se copiou a chave completa
2. Gere uma nova chave no Resend
3. Atualize a secret no Supabase

### Emails vão para spam
**Solução**:
1. Configure um domínio próprio no Resend
2. Adicione registros DNS (SPF, DKIM)
3. Evite palavras como "grátis", "promoção" em excesso

---

## 🎨 Personalizar Remetente

Por padrão, os emails são enviados de:
```
InfoShire <noreply@infoshire.com>
```

### Para usar seu domínio:

1. **No Resend**:
   - Vá em "Domains"
   - Adicione seu domínio
   - Configure os registros DNS

2. **No Código**:
   - Edite `/supabase/functions/send-email-campaign/index.ts`
   - Linha ~105: Altere o campo `from:`
   ```typescript
   from: 'Sua Empresa <contato@seudominio.com>',
   ```

3. **Redeploy**:
   ```bash
   supabase functions deploy send-email-campaign
   ```

---

## 📊 Monitorar Envios

### No Resend Dashboard

1. Acesse [resend.com/emails](https://resend.com/emails)
2. Veja todos os emails enviados
3. Status de entrega
4. Logs de erro

### No Sistema InfoShire

1. **Painel Admin → Email Marketing**
2. Aba **"Histórico"**
3. Veja todas as campanhas enviadas

---

## 🚀 Pronto para Usar!

Agora você pode:
- ✅ Enviar promoções para clientes
- ✅ Comunicar novidades
- ✅ Fazer campanhas de marketing
- ✅ Manter clientes informados

**Dica**: Comece com emails pequenos e teste antes de enviar para todos!

---

## 📞 Precisa de Ajuda?

- 📖 Documentação completa: `NOVAS_FUNCIONALIDADES.md`
- 🌐 Docs do Resend: [resend.com/docs](https://resend.com/docs)
- 💬 Suporte Resend: [resend.com/support](https://resend.com/support)

---

**Tempo estimado de setup**: 5 minutos ⏱️  
**Dificuldade**: Fácil 🟢
