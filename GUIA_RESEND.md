# 🎉 SOLUÇÃO FÁCIL: Use o Resend (Grátis!)

## ✨ Por que usar o Resend?

✅ **Totalmente GRÁTIS** até 3.000 emails por mês  
✅ **Não precisa** de email pessoal (@hotmail.com, @gmail.com, etc)  
✅ **Configuração super fácil** - apenas 1 chave API  
✅ **Mais seguro** - não expõe sua senha pessoal  
✅ **Mais confiável** - serviço profissional de envio de emails  
✅ **Sem limites diários** - envie quando quiser (até 3.000/mês)  

---

## 📖 Como Configurar (5 minutos)

### Passo 1: Criar Conta no Resend (GRÁTIS)

1. Acesse: **https://resend.com/signup**
2. Clique em **"Sign up"**
3. Preencha:
   - Email (pode ser qualquer email seu)
   - Senha
4. Confirme seu email
5. ✅ Pronto! Conta criada

### Passo 2: Gerar Chave API

1. Após fazer login no Resend, você verá o dashboard
2. No menu lateral, clique em **"API Keys"**
3. Clique no botão **"Create API Key"**
4. Dê um nome: **"InfoShire"**
5. Clique em **"Create"**
6. **COPIE A CHAVE** que aparece (ela só aparece uma vez!)
   - Exemplo: `re_123abc456def789ghi012jkl345mno678`
7. ✅ Guarde essa chave em um lugar seguro

### Passo 3: Configurar no Supabase

1. Acesse: **https://supabase.com/dashboard**
2. Faça login
3. Selecione seu projeto (InfoShire)
4. No menu lateral, clique no ícone de **engrenagem** ⚙️ (Settings)
5. Clique em **"Edge Functions"**
6. Procure por **"Environment Variables"** ou **"Secrets"**
7. Clique em **"Add new secret"** ou **"New variable"**
8. Preencha:
   - **Name:** `RESEND_API_KEY` (exatamente assim, em maiúsculas)
   - **Value:** Cole a chave que você copiou no Passo 2
9. Clique em **"Save"** ou **"Create"**
10. ✅ Variável configurada!

### Passo 4: Configurar no Sistema InfoShire

1. Acesse o sistema InfoShire
2. Vá em **Admin → Config. Email**
3. Em **"Provedor de Email"**, selecione: **"✨ Resend (Recomendado)"**
4. Preencha:
   - **Nome do Remetente:** `InfoShire Assistência Técnica` (ou o nome que quiser)
   - **Email do Remetente:** `onboarding@resend.dev` (deixe assim para testes)
5. Clique em **"Salvar Configuração"**
6. ✅ Configuração salva!

### Passo 5: Testar

1. Na mesma página (Config. Email)
2. Role até **"Testar Configuração"**
3. Digite seu email no campo **"Email para Teste"**
4. Clique em **"Enviar Email de Teste"**
5. Verifique sua caixa de entrada
6. ✅ Se recebeu o email, está funcionando!

---

## 🎯 Pronto para Usar!

Agora você pode:
- ✅ Enviar emails de marketing (Admin → Email Marketing)
- ✅ Enviar notificações automáticas para clientes
- ✅ Enviar até 3.000 emails por mês GRÁTIS

---

## 🔧 Configurações Avançadas (Opcional)

### Usar Seu Próprio Domínio

Se você tem um domínio (ex: `infoshire.com.br`), pode configurar para enviar emails como `contato@infoshire.com.br`:

1. No Resend Dashboard, vá em **"Domains"**
2. Clique em **"Add Domain"**
3. Digite seu domínio: `infoshire.com.br`
4. Siga as instruções para adicionar registros DNS
5. Após verificado, volte ao sistema InfoShire
6. Em **Config. Email**, mude o **Email do Remetente** para: `contato@infoshire.com.br`
7. Salve e teste!

**Vantagens:**
- ✅ Emails mais profissionais
- ✅ Maior taxa de entrega
- ✅ Clientes veem seu domínio

---

## ❓ Perguntas Frequentes

### P: Preciso pagar algo?
**R:** Não! O plano gratuito do Resend oferece 3.000 emails/mês, o que é mais que suficiente para a maioria das assistências técnicas.

### P: O que acontece se eu passar de 3.000 emails?
**R:** O Resend para de enviar e você precisa fazer upgrade para um plano pago (muito barato). Mas 3.000 emails/mês é bastante!

### P: Posso usar meu email pessoal em vez do Resend?
**R:** Sim, mas NÃO recomendamos porque:
- ❌ Menos seguro (expõe sua senha)
- ❌ Limites diários (ex: Hotmail limita a 300 emails/dia)
- ❌ Mais difícil de configurar
- ❌ Pode ser bloqueado como spam

### P: O email `onboarding@resend.dev` é confiável?
**R:** Sim! É o email de teste oficial do Resend. Mas se quiser algo mais profissional, configure seu próprio domínio (veja seção acima).

### P: Preciso criar uma conta nova no Resend para cada cliente?
**R:** Não! Uma conta Resend serve para todos os seus clientes. Você só precisa de uma chave API.

### P: A chave API expira?
**R:** Não, ela é permanente. Mas você pode revogá-la e criar uma nova a qualquer momento no dashboard do Resend.

### P: Posso ver quantos emails já enviei?
**R:** Sim! No dashboard do Resend você vê estatísticas completas de envios, aberturas, cliques, etc.

---

## 🆘 Problemas Comuns

### Erro: "Chave API do Resend não configurada"

**Solução:**
1. Verifique se você adicionou a variável `RESEND_API_KEY` no Supabase
2. Verifique se o nome está correto: `RESEND_API_KEY` (maiúsculas)
3. Verifique se a chave está correta (sem espaços extras)
4. Aguarde 1-2 minutos e tente novamente

### Erro: "Email não enviado"

**Solução:**
1. Verifique se salvou a configuração no sistema (Admin → Config. Email)
2. Verifique se selecionou "Resend" como provedor
3. Teste com o botão "Enviar Email de Teste"
4. Verifique o spam/lixo eletrônico

### Email não chega

**Solução:**
1. Verifique a caixa de spam
2. Aguarde alguns minutos (pode demorar)
3. Tente com outro email
4. Verifique no dashboard do Resend se o email foi enviado

---

## 📊 Comparação: Resend vs SMTP

| Característica | Resend | SMTP (Hotmail/Gmail) |
|----------------|--------|----------------------|
| **Preço** | Grátis (3.000/mês) | Grátis |
| **Configuração** | Fácil (1 chave) | Difícil (vários campos) |
| **Segurança** | Alta | Média (expõe senha) |
| **Limite diário** | Sem limite | 300-500 emails/dia |
| **Confiabilidade** | Alta | Média |
| **Profissional** | Sim | Não |
| **Estatísticas** | Sim | Não |
| **Recomendado** | ✅ SIM | ❌ Não |

---

## 🎉 Conclusão

O Resend é a **melhor opção** para o InfoShire porque:
1. É **grátis** e **fácil** de configurar
2. Não precisa usar seu email pessoal
3. É mais **seguro** e **confiável**
4. Oferece **estatísticas** e **monitoramento**
5. Não tem limites diários chatos

**Tempo total de configuração:** 5-10 minutos  
**Custo:** R$ 0,00  
**Dificuldade:** Fácil ⭐⭐☆☆☆  

---

**Última atualização:** 2026-01-04
