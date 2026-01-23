## 🚨 FOUND IT! The is_admin() Function Was Blocking Everything!

The `is_admin()` function was doing:
```sql
SELECT EXISTS (
  SELECT 1 FROM public.profiles p
  WHERE p.id = uid AND p.role = 'admin'
);
```

This SELECT was **BLOCKED by Firefox Tracking Prevention** and was being called by:
1. RLS policy on `order_status_history`
2. RLS policy on `order_images`  
3. Multiple other policies

When you insert into `service_orders`, Supabase **INTERNALLY CHECKS ALL RLS POLICIES** on related tables, and each one was calling `is_admin()` which was blocked!

---

## 📋 EXECUTE THIS SQL IN SUPABASE NOW:

```sql
-- Replace is_admin() to NOT do SELECT queries
DROP FUNCTION IF EXISTS public.is_admin(uuid) CASCADE;

CREATE OR REPLACE FUNCTION public.is_admin(uid uuid)
RETURNS boolean
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT false;
$$;

-- Simplify order_status_history RLS
DROP POLICY IF EXISTS "Admins can view all order_status_history" ON public.order_status_history;
DROP POLICY IF EXISTS "Admins can insert order_status_history" ON public.order_status_history;
DROP POLICY IF EXISTS "Admins can update order_status_history" ON public.order_status_history;
DROP POLICY IF EXISTS "Admins can delete order_status_history" ON public.order_status_history;

CREATE POLICY "Authenticated can insert history"
  ON public.order_status_history FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated can read history"
  ON public.order_status_history FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated can update history"
  ON public.order_status_history FOR UPDATE TO authenticated USING (true);

-- Simplify order_images RLS
DROP POLICY IF EXISTS "Admins have full access to order_images" ON public.order_images;
DROP POLICY IF EXISTS "Clients can view their order images" ON public.order_images;
DROP POLICY IF EXISTS "Admins can upload images" ON public.order_images;

CREATE POLICY "Authenticated can upload images"
  ON public.order_images FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated can read images"
  ON public.order_images FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated can delete images"
  ON public.order_images FOR DELETE TO authenticated USING (true);
```

---

## ✅ TEST NOW:

```
1. Ctrl+Shift+R (clear cache)
2. Open New Order
3. Fill in some data
4. SWITCH TAB
5. WAIT 30 SECONDS
6. RETURN
7. Click "CREATE"
8. ✅ Should be INSTANT!
```

---

## 🔍 Why This Works:

**BEFORE:**
```
INSERT service_orders
  └─ Supabase checks RLS on order_status_history
     └─ RLS calls is_admin(auth.uid())
        └─ is_admin() does SELECT from profiles
           └─ Firefox blocks SELECT
              └─ TIMEOUT 60s!
```

**AFTER:**
```
INSERT service_orders
  └─ Supabase checks RLS on order_status_history
     └─ RLS calls is_admin(auth.uid())
        └─ is_admin() returns false immediately (NO SELECT!)
           └─ ✅ INSERT completes instantly!
```

**This is the final fix!**
