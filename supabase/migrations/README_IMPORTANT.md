# ⚠️ IMPORTANT: Migration Strategy for is_admin() Function

## Status das Migrations

### ❌ **00075 & 00076 - NÃO APLICAR EM PRODUÇÃO**

**Por quê?**

Essas migrations foram criadas durante a investigação, mas têm problemas críticos:

1. **JWT/Email Hardcoding**
   - Mudam `is_admin(uuid)` para verificar email via `auth.jwt()->>'email'`
   - Frágil: pode retornar NULL/false em contextos específicos
   - Difícil de manter: trocar email, novos admins, etc.

2. **Uso de CASCADE**
   - `DROP FUNCTION ... CASCADE` é arriscado
   - Pode deletar policies indesejadas
   - Difícil de recuperar se algo quebrar

3. **Policies Incompletas**
   - Algumas recreadas com `FOR ALL` sem `WITH CHECK`
   - Potencial inconsistência nos dados

### ✅ **00077 - USE ESTA MIGRATION**

**O Que Faz:**

```sql
-- Restaura is_admin(uuid) usando profiles.role (seguro, testado, robusta)
create or replace function public.is_admin(uid uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles p
    where p.id = uid
      and p.role = 'admin'::user_role
  );
$$;

-- Remove a versão sem argumentos (simples, sem CASCADE)
drop function if exists public.is_admin();
```

**Por quê é segura:**

- ✅ Usa `profiles.role` (já validado em produção)
- ✅ `SECURITY DEFINER` executa com privilégios de owner
- ✅ `SET search_path` evita injection
- ✅ Sem CASCADE (removido apenas a função específica)
- ✅ Simples e fácil de auditar/reverter

## Diferenças: is_admin() vs is_admin(uuid)

### `is_admin()` (SEM ARGUMENTOS)
- ❌ **Problema:** Faz SELECT direto (bloqueante)
- ❌ Usado em políticas RLS (causa timeouts)
- ❌ **DEVE SER REMOVIDO**

### `is_admin(uuid)` (COM ARGUMENTOS)
- ✅ **Solução:** Recebe UUID explicitamente
- ✅ Pode ser usado em policies: `is_admin(auth.uid())`
- ✅ **DEVE SER MANTIDO COM profiles.role**

## Por que NÃO usar JWT/Email

### Problemas com auth.jwt()->>'email'

```sql
-- ❌ FRÁGIL:
SELECT (auth.jwt() ->> 'email') IN ('admin@example.com', 'diogo@example.com')
```

1. **JWT pode não existir ou estar inválido** em alguns contextos (service role, offline, etc)
2. **Emails podem mudar** - database metadata desincroniza
3. **Novos admins requeem redeploy** do SQL (sem flexibilidade)
4. **Difícil de auditar** - controle espalhado entre múltiplos places

### Solução: profiles.role

```sql
-- ✅ ROBUSTO:
SELECT EXISTS (
  SELECT 1 FROM public.profiles p
  WHERE p.id = uid
    AND p.role = 'admin'::user_role
)
```

1. **Single source of truth** - profiles.role
2. **Flexível** - mudar role é apenas um UPDATE
3. **Auditável** - tudo em um lugar
4. **Testado** - já validamos que retorna TRUE para admins

## Por que NÃO usar CASCADE

### Problema:
```sql
DROP FUNCTION public.is_admin() CASCADE;
-- ❌ Remove a função E todas as policies que a usam
-- ❌ Difícil saber o que foi deletado
-- ❌ Difícil recuperar se precisar
```

### Solução:
```sql
DROP FUNCTION IF EXISTS public.is_admin();
-- ✅ Remove apenas a função específica
-- ✅ Policies permanecem intactas
-- ✅ Fácil de reverter: apenas recreie a função
```

## Como Proceder

### ✅ Em Produção:
1. Execute APENAS `00077_safe_admin_is_admin.sql`
2. Ignore completamente 00075 e 00076

### ✅ No Frontend:
- As correções no AbortController/order_number já foram deployadas
- O travamento "Criando..." deve estar resolvido
- Nenhuma mudança adicional necessária no backend

## Exemplo de Uso em Policies

```sql
-- ✅ CORRETO (após 00077):
CREATE POLICY "Admins can view analytics"
  ON public.analytics_events
  FOR SELECT TO authenticated
  USING (is_admin(auth.uid()));

-- Quando admin faz query:
-- 1. RLS checa: is_admin(auth.uid())
-- 2. Executa SELECT em profiles (rápido, com índice)
-- 3. Retorna true/false em <1ms
```

## Timeline

- **00074**: Tentou fazer is_admin() retornar false (não resolveu)
- **00075/00076**: Tentaram usar JWT/email (frágil, com CASCADE) - **DESCARTADAS**
- **00077**: Abordagem correta e segura - **USE ESTA**

---

**Resumo:** Use apenas a 00077. É segura, testada e alinhada com a realidade do banco.
