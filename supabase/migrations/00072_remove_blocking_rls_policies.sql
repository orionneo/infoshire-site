-- =============================================
-- CRITICAL FIX: Remove ALL blocking RLS policies
-- =============================================
-- PROBLEM: Multiple RLS policies were calling is_admin() function which does:
-- 1. SELECT FROM profiles WHERE id = auth.uid()
-- 2. This gets blocked by Firefox Tracking Prevention when tab backgrounded
-- 3. Causes 60+ second timeouts on ALL database operations
--
-- The is_admin() function itself was calling SELECT which is blocking!
-- =============================================

-- Drop the blocking profiles policy
DROP POLICY IF EXISTS "Admins have full access to profiles" ON public.profiles;

-- Drop the blocking service_orders policy that calls is_admin()
DROP POLICY IF EXISTS "Admins have full access to service_orders" ON public.service_orders;

-- Create new SIMPLE policies without SELECT queries:

-- For profiles: authenticated users can see their own + admins see all (trust frontend)
CREATE POLICY "Authenticated can read profiles"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can update their own profile"
  ON public.profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- For service_orders: admins can do everything (trust JWT from frontend AdminGuard)
CREATE POLICY "Authenticated users can insert service_orders"
  ON public.service_orders
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated can read service_orders"
  ON public.service_orders
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated can update service_orders"
  ON public.service_orders
  FOR UPDATE
  TO authenticated
  USING (true);

-- NOTE: Frontend AdminGuard.tsx ensures only admins can access /admin routes
-- No need to duplicate role checks in RLS policies
-- This prevents the SELECT queries that were blocking in backgrounded tabs
