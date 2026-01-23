-- 00077_safe_admin_is_admin.sql
-- SAFE FIX: restore is_admin(uid) using profiles.role (no JWT hardcode, no CASCADE)

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

-- Remove no-args version if it exists (NO CASCADE)
drop function if exists public.is_admin();
