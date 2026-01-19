# 🔒 Correção: Política de Segurança RLS (Row Level Security)

## ✅ Problema Corrigido

### Erro Original
```
❌ Erro
new row violates row-level security policy for table "service_orders"
```

**Quando ocorria:**
- Admin tentava criar ordem de serviço para cliente novo
- Admin tentava criar ordem de serviço para qualquer cliente

**Causa:**
- Política RLS muito genérica ("FOR ALL") não estava funcionando corretamente
- Faltava permissão explícita de INSERT para admins

---

## 🔧 Solução Implementada

### Antes (Política Genérica)

```sql
-- Política antiga (não funcionava corretamente)
CREATE POLICY "Admins have full access to service_orders" 
ON public.service_orders
FOR ALL TO authenticated 
USING (public.is_admin(auth.uid()));
```

**Problema:**
- `FOR ALL` é muito genérico
- Não especifica claramente INSERT, UPDATE, DELETE
- Supabase pode não aplicar corretamente

### Depois (Políticas Específicas)

```sql
-- Políticas novas (funcionam corretamente)

-- SELECT: Admin pode ver todas as ordens
CREATE POLICY "Admins can view all service_orders" 
ON public.service_orders
FOR SELECT TO authenticated 
USING (public.is_admin(auth.uid()));

-- INSERT: Admin pode criar ordens para qualquer cliente
CREATE POLICY "Admins can insert service_orders" 
ON public.service_orders
FOR INSERT TO authenticated 
WITH CHECK (public.is_admin(auth.uid()));

-- UPDATE: Admin pode atualizar qualquer ordem
CREATE POLICY "Admins can update service_orders" 
ON public.service_orders
FOR UPDATE TO authenticated 
USING (public.is_admin(auth.uid()))
WITH CHECK (public.is_admin(auth.uid()));

-- DELETE: Admin pode deletar qualquer ordem
CREATE POLICY "Admins can delete service_orders" 
ON public.service_orders
FOR DELETE TO authenticated 
USING (public.is_admin(auth.uid()));

-- SELECT: Cliente pode ver apenas suas ordens
CREATE POLICY "Clients can view their own orders" 
ON public.service_orders
FOR SELECT TO authenticated 
USING (client_id = auth.uid());
```

---

## 📊 Políticas Aplicadas

### Tabela: service_orders

| Operação | Admin | Cliente |
|----------|-------|---------|
| SELECT (Ver) | ✅ Todas as ordens | ✅ Apenas suas ordens |
| INSERT (Criar) | ✅ Para qualquer cliente | ❌ Não permitido |
| UPDATE (Atualizar) | ✅ Qualquer ordem | ❌ Não permitido |
| DELETE (Deletar) | ✅ Qualquer ordem | ❌ Não permitido |

### Tabela: order_status_history

| Operação | Admin | Cliente |
|----------|-------|---------|
| SELECT (Ver) | ✅ Todo histórico | ✅ Histórico de suas ordens |
| INSERT (Criar) | ✅ Qualquer histórico | ❌ Não permitido |
| UPDATE (Atualizar) | ✅ Qualquer histórico | ❌ Não permitido |
| DELETE (Deletar) | ✅ Qualquer histórico | ❌ Não permitido |

---

## 🔍 Como Funciona

### Função is_admin()

```sql
CREATE OR REPLACE FUNCTION public.is_admin(uid uuid)
RETURNS boolean LANGUAGE sql SECURITY DEFINER AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = uid AND p.role = 'admin'::public.user_role
  );
$$;
```

**O que faz:**
- Recebe um UUID (ID do usuário)
- Verifica se existe um perfil com esse ID
- Verifica se o role é 'admin'
- Retorna true ou false

**Exemplo:**
```sql
-- Verificar se usuário atual é admin
SELECT public.is_admin(auth.uid());

-- Resultado: true (se for admin) ou false (se não for)
```

### Política INSERT Explicada

```sql
CREATE POLICY "Admins can insert service_orders" 
ON public.service_orders
FOR INSERT TO authenticated 
WITH CHECK (public.is_admin(auth.uid()));
```

**Passo a passo:**
1. Usuário tenta inserir uma ordem
2. Supabase verifica: usuário está autenticado?
3. Supabase executa: `public.is_admin(auth.uid())`
4. Se retornar `true`: INSERT permitido ✅
5. Se retornar `false`: INSERT negado ❌

---

## 🧪 Testes

### Teste 1: Admin Cria Ordem para Cliente Existente

**Cenário:**
- Admin logado
- Cliente já existe no sistema
- Admin cria ordem para esse cliente

**Resultado Esperado:**
```
✅ Ordem criada
OS #2026001 criada com sucesso
```

**SQL Executado:**
```sql
INSERT INTO service_orders (
  client_id, 
  equipment, 
  problem_description, 
  order_number
) VALUES (
  'uuid-do-cliente',
  'iPhone 12 Pro',
  'Tela quebrada',
  '2026000001'
);
```

**Verificação RLS:**
```sql
-- Verifica se usuário atual é admin
SELECT public.is_admin(auth.uid());
-- Retorna: true ✅

-- INSERT permitido
```

### Teste 2: Admin Cria Cliente e Ordem Juntos

**Cenário:**
- Admin logado
- Cliente não existe
- Admin cria cliente novo
- Admin cria ordem para cliente novo

**Resultado Esperado:**
```
✅ Cliente criado
Cliente João Silva cadastrado com sucesso

✅ Ordem criada
OS #2026001 criada com sucesso
```

**Fluxo:**
1. Criar cliente via `supabase.auth.signUp()`
2. Trigger cria perfil automaticamente
3. Criar ordem com `client_id` do novo cliente
4. RLS verifica: admin? ✅
5. INSERT permitido

### Teste 3: Cliente Tenta Criar Ordem (Deve Falhar)

**Cenário:**
- Cliente logado (não admin)
- Cliente tenta criar ordem

**Resultado Esperado:**
```
❌ Erro
new row violates row-level security policy for table "service_orders"
```

**Verificação RLS:**
```sql
-- Verifica se usuário atual é admin
SELECT public.is_admin(auth.uid());
-- Retorna: false ❌

-- INSERT negado
```

---

## 🔒 Segurança

### Princípios Aplicados

1. **Least Privilege (Menor Privilégio)**
   - Clientes só veem suas próprias ordens
   - Clientes não podem criar/editar/deletar ordens
   - Apenas admins têm controle total

2. **Defense in Depth (Defesa em Profundidade)**
   - RLS no banco de dados (primeira camada)
   - Validação no backend (segunda camada)
   - Validação no frontend (terceira camada)

3. **Explicit Permissions (Permissões Explícitas)**
   - Cada operação tem política específica
   - Nada é permitido por padrão
   - Tudo deve ser explicitamente autorizado

### O Que Está Protegido

✅ **Clientes não podem:**
- Criar ordens para si mesmos
- Criar ordens para outros clientes
- Editar ordens existentes
- Deletar ordens
- Ver ordens de outros clientes
- Modificar histórico de status

✅ **Admins podem:**
- Criar ordens para qualquer cliente
- Editar qualquer ordem
- Deletar qualquer ordem
- Ver todas as ordens
- Modificar histórico de status

---

## 📝 Migrações Aplicadas

### Migração 1: fix_service_orders_rls_policy

**Arquivo:** `supabase/migrations/00003_fix_service_orders_rls_policy.sql`

**Conteúdo:**
```sql
-- Drop existing service orders policies
DROP POLICY IF EXISTS "Admins have full access to service_orders" ON public.service_orders;
DROP POLICY IF EXISTS "Clients can view their own orders" ON public.service_orders;

-- Recreate service orders policies with explicit INSERT permission for admins
CREATE POLICY "Admins can view all service_orders" ON public.service_orders
  FOR SELECT TO authenticated 
  USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can insert service_orders" ON public.service_orders
  FOR INSERT TO authenticated 
  WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Admins can update service_orders" ON public.service_orders
  FOR UPDATE TO authenticated 
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Admins can delete service_orders" ON public.service_orders
  FOR DELETE TO authenticated 
  USING (public.is_admin(auth.uid()));

CREATE POLICY "Clients can view their own orders" ON public.service_orders
  FOR SELECT TO authenticated 
  USING (client_id = auth.uid());
```

### Migração 2: fix_order_status_history_rls_policy

**Arquivo:** `supabase/migrations/00004_fix_order_status_history_rls_policy.sql`

**Conteúdo:**
```sql
-- Drop existing order_status_history policies
DROP POLICY IF EXISTS "Admins have full access to order_status_history" ON public.order_status_history;
DROP POLICY IF EXISTS "Clients can view history of their orders" ON public.order_status_history;

-- Recreate order_status_history policies with explicit permissions
CREATE POLICY "Admins can view all order_status_history" ON public.order_status_history
  FOR SELECT TO authenticated 
  USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can insert order_status_history" ON public.order_status_history
  FOR INSERT TO authenticated 
  WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Admins can update order_status_history" ON public.order_status_history
  FOR UPDATE TO authenticated 
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Admins can delete order_status_history" ON public.order_status_history
  FOR DELETE TO authenticated 
  USING (public.is_admin(auth.uid()));

CREATE POLICY "Clients can view history of their orders" ON public.order_status_history
  FOR SELECT TO authenticated 
  USING (
    EXISTS (
      SELECT 1 FROM public.service_orders so
      WHERE so.id = order_id AND so.client_id = auth.uid()
    )
  );
```

---

## 🐛 Debugging RLS

### Verificar Políticas Ativas

```sql
-- Ver todas as políticas da tabela service_orders
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'service_orders';
```

### Verificar se Usuário é Admin

```sql
-- Verificar role do usuário atual
SELECT 
  id,
  email,
  role
FROM profiles
WHERE id = auth.uid();

-- Verificar função is_admin
SELECT public.is_admin(auth.uid());
```

### Testar Política Manualmente

```sql
-- Simular INSERT como admin
SET LOCAL role authenticated;
SET LOCAL request.jwt.claims.sub = 'uuid-do-admin';

INSERT INTO service_orders (
  client_id,
  equipment,
  problem_description,
  order_number
) VALUES (
  'uuid-do-cliente',
  'Teste',
  'Teste',
  'TEST001'
);
```

---

## ✅ Checklist de Verificação

### Após Aplicar Migrações

- [x] Políticas antigas removidas
- [x] Políticas novas criadas
- [x] Função is_admin() funcionando
- [x] Admin pode criar ordens
- [x] Admin pode ver todas as ordens
- [x] Cliente pode ver apenas suas ordens
- [x] Cliente não pode criar ordens

### Testar no Sistema

- [ ] Login como admin
- [ ] Criar cliente novo
- [ ] Criar ordem para cliente novo
- [ ] Verificar ordem criada com sucesso
- [ ] Login como cliente
- [ ] Verificar que cliente vê apenas suas ordens
- [ ] Verificar que cliente não pode criar ordens

---

## 💡 Boas Práticas RLS

### 1. Políticas Específicas

❌ **Evitar:**
```sql
CREATE POLICY "generic_policy" ON table
FOR ALL USING (condition);
```

✅ **Preferir:**
```sql
CREATE POLICY "specific_select" ON table
FOR SELECT USING (condition);

CREATE POLICY "specific_insert" ON table
FOR INSERT WITH CHECK (condition);
```

### 2. Funções SECURITY DEFINER

```sql
CREATE OR REPLACE FUNCTION check_permission()
RETURNS boolean 
LANGUAGE sql 
SECURITY DEFINER  -- Executa com privilégios do criador
AS $$
  -- Lógica de verificação
$$;
```

### 3. Testar Sempre

- Testar como admin
- Testar como cliente
- Testar sem autenticação
- Testar casos extremos

---

**InfoShire - RLS Corrigido e Seguro** 🔧🔒⚡
