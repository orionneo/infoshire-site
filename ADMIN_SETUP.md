# 🔐 Guia de Configuração do Administrador

## Credenciais de Acesso Padrão

### Usuário Administrador
- **Usuário**: `admin`
- **Senha**: `admin123`

⚠️ **IMPORTANTE**: Altere a senha padrão após o primeiro acesso!

---

## 📋 Como Criar o Usuário Administrador

Você tem **3 opções** para criar o usuário administrador:

### Opção 1: Página de Inicialização (Mais Fácil) ✅

1. Acesse a URL: `/init-admin`
2. Clique no botão "Criar Administrador Padrão"
3. Aguarde a confirmação
4. Clique em "Ir para Login"
5. Faça login com as credenciais:
   - Usuário: `admin`
   - Senha: `admin123`

### Opção 2: Primeiro Registro (Recomendado) ⭐

1. Acesse a página de registro: `/register`
2. Crie uma conta com qualquer usuário e senha de sua escolha
3. **O primeiro usuário registrado automaticamente se torna administrador**
4. Você será redirecionado para o painel administrativo

### Opção 3: Via Supabase Dashboard (Avançado)

1. Acesse o Supabase Dashboard
2. Vá para Authentication > Users
3. Clique em "Add User"
4. Crie o usuário com email: `admin@miaoda.com`
5. Defina a senha: `admin123`
6. Confirme o email automaticamente
7. Vá para Table Editor > profiles
8. Encontre o usuário criado
9. Altere o campo `role` para `admin`

---

## 🎯 Após Criar o Administrador

### 1. Primeiro Acesso
- Acesse `/login`
- Entre com as credenciais do administrador
- Você será redirecionado para `/admin` (Dashboard Administrativo)

### 2. Alterar Senha (Recomendado)
- Acesse `/admin/users`
- Encontre seu usuário
- Use a funcionalidade de alteração de senha do Supabase

### 3. Configurar o Sistema
- **Configurações do Site** (`/admin/settings`):
  - Personalize o nome do site
  - Atualize textos da página inicial
  - Configure informações de contato
  - Adicione conteúdo da página "Sobre"

### 4. Criar Clientes
- Os clientes podem se registrar em `/register`
- Ou você pode criar ordens de serviço para clientes existentes

### 5. Gerenciar Usuários
- Acesse `/admin/users`
- Visualize todos os usuários do sistema
- Altere permissões (Cliente ↔ Administrador)

---

## 🔒 Segurança

### Boas Práticas

1. **Altere a senha padrão imediatamente**
   - A senha `admin123` é conhecida e insegura
   - Use uma senha forte com letras, números e símbolos

2. **Crie usuários específicos**
   - Não compartilhe a conta admin
   - Crie contas separadas para cada técnico/admin

3. **Gerencie permissões adequadamente**
   - Dê permissão de admin apenas para quem precisa
   - Clientes devem ter apenas permissão de cliente

4. **Monitore acessos**
   - Verifique regularmente os usuários cadastrados
   - Remova contas inativas

---

## 📱 Estrutura de Permissões

### Cliente (role: client)
✅ Pode:
- Ver suas próprias ordens de serviço
- Acompanhar status em tempo real
- Conversar com técnicos via chat
- Enviar fotos do equipamento
- Editar seu próprio perfil

❌ Não pode:
- Ver ordens de outros clientes
- Criar ou editar ordens
- Acessar painel administrativo
- Gerenciar usuários
- Alterar configurações do site

### Administrador (role: admin)
✅ Pode:
- Tudo que o cliente pode
- Ver todas as ordens de serviço
- Criar, editar e excluir ordens
- Atualizar status das ordens
- Conversar com todos os clientes
- Gerenciar todos os usuários
- Alterar permissões de usuários
- Personalizar o site
- Acessar dashboard com métricas

---

## 🆘 Problemas Comuns

### "Usuário admin já existe"
- O usuário já foi criado anteriormente
- Tente fazer login com as credenciais padrão
- Ou use a opção de recuperação de senha

### "Erro ao criar administrador"
- Verifique se o Supabase está configurado corretamente
- Confirme que a Edge Function está ativa
- Tente a Opção 2 (Primeiro Registro)

### "Não consigo acessar o painel admin"
- Verifique se seu usuário tem `role = 'admin'` na tabela profiles
- Faça logout e login novamente
- Limpe o cache do navegador

### "Esqueci a senha do admin"
- Use a funcionalidade de recuperação de senha do Supabase
- Ou crie um novo usuário admin via Supabase Dashboard
- Ou recrie o usuário usando a Opção 1

---

## 📞 Suporte Técnico

Para problemas técnicos:
1. Verifique os logs do navegador (F12 > Console)
2. Verifique os logs do Supabase
3. Consulte a documentação do código
4. Revise o arquivo README_SISTEMA.md

---

**Sistema TechFix - Gestão de Assistências Técnicas**
*Desenvolvido com segurança e praticidade em mente*
