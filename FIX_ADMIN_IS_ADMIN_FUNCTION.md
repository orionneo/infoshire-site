# 🚨 CORRIGIDO: Bloqueio de Admin por is_admin() Retornando False

## 🔴 Problema Identificado

O admin `admin@infoshire.com.br` estava fora da tab por 30 segundos e depois ao volta, fica "Criando..." até falhar.

### Causa Raiz:

1. **Função `is_admin()` retorna `false` sempre**
   - Foi alterada em migration `00074` para sempre retornar `false`
   - Propósito: evitar SELECT queries que causavam timeouts

2. **MAS as políticas RLS ainda chamam `is_admin()`**
   - `analytics_events` usa `is_admin()` para SELECT, DELETE, UPDATE
   - `analytics_pageviews` usa `is_admin()` para SELECT, DELETE, UPDATE
   - `analytics_sessions` usa `is_admin()` para SELECT, DELETE, UPDATE
   - `analytics_sources` usa `is_admin()` para SELECT, DELETE, UPDATE
   - `messages` usa `is_admin()` para DELETE, UPDATE
   - `order_images` usa `is_admin()` para DELETE, UPDATE
   - `service_order_items` usa `is_admin()` para DELETE, UPDATE
   - `order_status_history` usa `is_admin()` para SELECT, ALL

3. **Resultado:**
   - Admin tenta acessar dashboard
   - RLS checa: `is_admin()` retorna `false`
   - Admin é bloqueado de ler/escrever
   - 30 segundos depois: timeout, falha na criação

## ✅ Solução Implementada

Nova migration `00075_fix_admin_check_in_all_policies.sql`:

### 1. Função `is_admin()` Corrigida

```sql
DROP FUNCTION IF EXISTS public.is_admin(uuid) CASCADE;

CREATE OR REPLACE FUNCTION public.is_admin(uid uuid)
RETURNS boolean
LANGUAGE sql
STABLE
AS $$
  SELECT COALESCE(
    (auth.jwt() ->> 'email') IN ('admin@infoshire.com.br', 'diogo@infoshire.com.br', 'financeiro@infoshire.com.br'),
    false
  );
$$;
```

**Mudanças:**
- ✅ Usa `auth.jwt() ->> 'email'` (sem SELECT, sem blocking)
- ✅ Checa lista de emails admin conhecidos
- ✅ Retorna `true` para admins legítimos
- ✅ Retorna `false` para users normais

### 2. Políticas Refeitas

Todas as políticas que usam `is_admin()` foram RECRIADAS com a nova função:

- `analytics_events_delete_admin` ✅
- `analytics_events_select_admin` ✅
- `analytics_events_update_admin` ✅
- `analytics_pageviews_delete_admin` ✅
- `analytics_pageviews_select_admin` ✅
- `analytics_pageviews_update_admin` ✅
- `analytics_sessions_delete_admin` ✅
- `analytics_sessions_select_admin` ✅
- `analytics_sessions_update_admin` ✅
- `analytics_sources_delete_admin` ✅
- `analytics_sources_select_admin` ✅
- `analytics_sources_update_admin` ✅
- `messages_delete_admin_only` ✅
- `messages_update_admin_only` ✅
- `order_images_delete_admin_only` ✅
- `order_images_update_admin_only` ✅
- `service_order_items_delete_admin_only` ✅
- `service_order_items_update_admin_only` ✅
- `order_status_history_select_admin` ✅
- `order_status_history_write_admin_only` ✅

## 🔧 Como Executar

### Opção 1: Via Supabase SQL Editor (Recomendado)

1. Vá para: **Supabase Dashboard → SQL Editor**
2. Crie uma nova query
3. Copie TODO o conteúdo de:
   ```
   supabase/migrations/00075_fix_admin_check_in_all_policies.sql
   ```
4. **Execute** (Ctrl+Enter ou CMD+Enter)
5. Veja ✅ na parte verde se sucesso

### Opção 2: Via Terminal (se tiver CLI do Supabase)

```bash
supabase db push
```

Isso executará todas as migrations pendentes, incluindo a 00075.

## ✅ Verificação

Após executar, testar:

1. **Admin faz login**
2. **Vai para `/admin/analytics`**
3. **Sai da tab, espera 30 segundos**
4. **Volta para tab**
5. **Clica em "Criar" ou "Atualizar"**

**Esperado:** ✅ Operação completa em <5 segundos (não "Criando..." infinito)

## 📊 Antes vs Depois

### Antes (Bloqueado)
```
1. Admin faz login (OK)
2. Admin vai para analytics (RLS bloqueia: is_admin() = false)
3. Query timeout após 30s
4. "Criando..." falha
```

### Depois (Liberado)
```
1. Admin faz login (OK)
2. Admin vai para analytics (RLS libera: is_admin() = true)
3. Query executa em <1s
4. Dashboard carrega normalmente
```

## 🎯 Por Que Funcionará?

A nova função `is_admin()`:

1. **Não faz SELECT** (evita bloqueios)
2. **Usa JWT Token** (disponível no contexto do Supabase automaticamente)
3. **Checa email do usuário** (confiável, não pode ser falsificado)
4. **STABLE** (pode ser cacheado pelo Postgres, performático)

## ⚠️ Adicionar Novos Admins

Se precisar adicionar novos admins, edite a função:

```sql
CREATE OR REPLACE FUNCTION public.is_admin(uid uuid)
RETURNS boolean
LANGUAGE sql
STABLE
AS $$
  SELECT COALESCE(
    (auth.jwt() ->> 'email') IN (
      'admin@infoshire.com.br',
      'diogo@infoshire.com.br',
      'financeiro@infoshire.com.br',
      'novo.admin@infoshire.com.br'  -- <-- ADICIONAR AQUI
    ),
    false
  );
$$;
```

Depois execute essa query para atualizar a função.
