# 🔐 Como Configurar a Senha SMTP no Supabase

## ⚠️ IMPORTANTE: A senha NÃO é salva no formulário!

Quando você preenche o formulário em "Config. Email", a senha **NÃO** é salva no banco de dados por questões de segurança. 

A senha precisa ser configurada **MANUALMENTE** no Supabase Dashboard como uma variável de ambiente.

---

## 📋 Passo a Passo Detalhado

### Passo 1: Acesse o Supabase Dashboard

1. Abra seu navegador
2. Acesse: **https://supabase.com/dashboard**
3. Faça login com sua conta Supabase
4. Você verá a lista dos seus projetos

### Passo 2: Selecione Seu Projeto

1. Clique no projeto do InfoShire (ou o nome que você deu)
2. Aguarde o projeto carregar

### Passo 3: Vá para as Configurações

1. No menu lateral esquerdo, procure o ícone de **engrenagem** ⚙️
2. Clique em **"Settings"** (Configurações)
3. Você verá várias opções de configuração

### Passo 4: Acesse Edge Functions

1. No menu de Settings, procure por **"Edge Functions"**
2. Clique em **"Edge Functions"**
3. Você verá informações sobre as funções do seu projeto

### Passo 5: Adicione a Variável de Ambiente

1. Procure pela seção **"Environment Variables"** ou **"Secrets"**
2. Clique no botão **"Add new secret"** ou **"New variable"** ou **"Add variable"**
3. Um formulário aparecerá com dois campos:

   **Campo 1 - Name (Nome):**
   ```
   SMTP_PASSWORD
   ```
   ⚠️ Digite exatamente assim, em MAIÚSCULAS, sem espaços!

   **Campo 2 - Value (Valor):**
   ```
   [Sua senha do Hotmail aqui]
   ```
   ⚠️ Cole a senha do seu email Hotmail/Outlook

4. Clique em **"Save"** ou **"Create"** ou **"Add"**

### Passo 6: Confirme a Criação

1. Após salvar, você deve ver a variável `SMTP_PASSWORD` na lista
2. O valor ficará oculto (●●●●●●●●) por segurança
3. ✅ Pronto! A senha está configurada!

---

## 🔄 Agora Teste o Sistema

1. Volte para o sistema InfoShire
2. Acesse **Admin > Email Marketing**
3. Crie uma campanha de teste
4. Selecione um destinatário
5. Clique em **"Enviar Campanha"**
6. ✅ Deve funcionar agora!

---

## 🔐 Dica de Segurança: Use Senha de Aplicativo

Em vez de usar sua senha principal do Hotmail, é **MUITO MAIS SEGURO** usar uma senha de aplicativo:

### Como Criar Senha de Aplicativo:

1. Acesse: **https://account.microsoft.com/security**
2. Faça login com sua conta Microsoft
3. Vá em **"Segurança"**
4. Clique em **"Opções de segurança avançadas"**
5. Procure por **"Senhas de aplicativo"**
6. Clique em **"Criar uma nova senha de aplicativo"**
7. Dê um nome: **"InfoShire Email"**
8. Copie a senha gerada (será algo como: `abcd-efgh-ijkl-mnop`)
9. Use essa senha no **Passo 5** acima (no campo Value)

**Vantagens:**
- ✅ Mais seguro que a senha principal
- ✅ Pode ser revogada sem mudar sua senha principal
- ✅ Específica para cada aplicação

---

## ❓ Perguntas Frequentes

### P: Preciso preencher o campo "Senha" no formulário?
**R:** Não! Deixe em branco. A senha é configurada apenas no Supabase.

### P: Onde fica "Environment Variables" no Supabase?
**R:** Settings (⚙️) → Edge Functions → Environment Variables (ou Secrets)

### P: O nome da variável pode ser diferente?
**R:** NÃO! Deve ser exatamente `SMTP_PASSWORD` (em maiúsculas).

### P: Posso ver a senha depois de salvar?
**R:** Não, por segurança ela fica oculta. Mas você pode editar e trocar.

### P: Preciso reiniciar algo depois de salvar?
**R:** Não, a variável fica disponível imediatamente.

---

## 🆘 Ainda com Problemas?

Se mesmo após configurar a variável `SMTP_PASSWORD` no Supabase você ainda receber o erro:

1. ✅ Verifique se o nome está correto: `SMTP_PASSWORD` (maiúsculas)
2. ✅ Verifique se a senha está correta (sem espaços extras)
3. ✅ Tente usar uma senha de aplicativo em vez da senha principal
4. ✅ Aguarde 1-2 minutos e tente novamente
5. ✅ Verifique se está no projeto correto no Supabase

---

## 📸 Resumo Visual

```
Supabase Dashboard
    ↓
Settings (⚙️)
    ↓
Edge Functions
    ↓
Environment Variables
    ↓
Add new secret
    ↓
Name: SMTP_PASSWORD
Value: [sua senha]
    ↓
Save
    ↓
✅ Pronto!
```

---

**Última atualização:** 2026-01-04
