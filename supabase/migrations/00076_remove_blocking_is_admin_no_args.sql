-- =============================================
-- CRITICAL FIX: Remove blocking is_admin() function (no args)
-- =============================================
-- DISCOVERY: Two versions of is_admin() exist in production:
--
-- 1. is_admin() - NO ARGUMENTS
--    ❌ BLOCKING: SELECT EXISTS (SELECT 1 FROM profiles WHERE...)
--    ❌ Causes 30-60 second timeouts in policies
--    ❌ This is the REAL culprit!
--
-- 2. is_admin(uid uuid) - WITH ARGUMENT  
--    ✅ Returns false (safe but useless)
--    ✅ Not called by policies (wrong signature)
--
-- SOLUTION:
-- 1. DROP is_admin() function WITHOUT arguments (CASCADE removes policies that call it)
-- 2. Recreate all affected policies calling is_admin(auth.uid()) with proper logic
-- 3. Update is_admin(uuid) to use JWT token (non-blocking)
-- =============================================

-- STEP 1: Update the is_admin(uuid) function to use JWT (non-blocking)
-- This will become the primary admin check function
DROP FUNCTION IF EXISTS public.is_admin(uuid) CASCADE;

CREATE OR REPLACE FUNCTION public.is_admin(uid uuid)
RETURNS boolean
LANGUAGE sql
STABLE
AS $$
  SELECT COALESCE(
    (auth.jwt() ->> 'email') IN (
      'admin@infoshire.com.br',
      'diogo@infoshire.com.br',
      'financeiro@infoshire.com.br'
    ),
    false
  );
$$;

-- STEP 2: Drop the blocking is_admin() function (no arguments)
-- CASCADE will drop any policies that depend on it
-- We will recreate them below with the corrected version
DROP FUNCTION IF EXISTS public.is_admin() CASCADE;

-- STEP 3: Recreate all RLS policies that were dropped by CASCADE
-- These now will call is_admin(auth.uid()) properly

-- =============================================
-- MESSAGES POLICIES (from 00001)
-- =============================================

CREATE POLICY "Admins have full access to messages" ON public.messages
  FOR ALL TO authenticated 
  USING (public.is_admin(auth.uid()));

-- =============================================
-- SITE SETTINGS POLICIES (from 00001)
-- =============================================

CREATE POLICY "Admins can manage site_settings" ON public.site_settings
  FOR ALL TO authenticated 
  USING (public.is_admin(auth.uid()));

-- =============================================
-- PROFILE POLICIES (admin updates)
-- =============================================

CREATE POLICY "Admins can manage profiles" ON public.profiles
  FOR ALL TO authenticated
  USING (public.is_admin(auth.uid()));

-- =============================================
-- Service order related policies that may have been affected
-- =============================================

CREATE POLICY "Admins have full access to service_orders" ON public.service_orders
  FOR ALL TO authenticated
  USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins have full access to order_status_history" ON public.order_status_history
  FOR ALL TO authenticated
  USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins have full access to order_images" ON public.order_images
  FOR ALL TO authenticated
  USING (public.is_admin(auth.uid()));

-- =============================================
-- ANALYTICS POLICIES (all admin operations)
-- =============================================

CREATE POLICY "analytics_events_delete_admin" ON public.analytics_events
  FOR DELETE TO authenticated
  USING (public.is_admin(auth.uid()));

CREATE POLICY "analytics_events_select_admin" ON public.analytics_events
  FOR SELECT TO authenticated
  USING (public.is_admin(auth.uid()));

CREATE POLICY "analytics_events_update_admin" ON public.analytics_events
  FOR UPDATE TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "analytics_pageviews_delete_admin" ON public.analytics_pageviews
  FOR DELETE TO authenticated
  USING (public.is_admin(auth.uid()));

CREATE POLICY "analytics_pageviews_select_admin" ON public.analytics_pageviews
  FOR SELECT TO authenticated
  USING (public.is_admin(auth.uid()));

CREATE POLICY "analytics_pageviews_update_admin" ON public.analytics_pageviews
  FOR UPDATE TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "analytics_sessions_delete_admin" ON public.analytics_sessions
  FOR DELETE TO authenticated
  USING (public.is_admin(auth.uid()));

CREATE POLICY "analytics_sessions_select_admin" ON public.analytics_sessions
  FOR SELECT TO authenticated
  USING (public.is_admin(auth.uid()));

CREATE POLICY "analytics_sessions_update_admin" ON public.analytics_sessions
  FOR UPDATE TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "analytics_sources_delete_admin" ON public.analytics_sources
  FOR DELETE TO authenticated
  USING (public.is_admin(auth.uid()));

CREATE POLICY "analytics_sources_select_admin" ON public.analytics_sources
  FOR SELECT TO authenticated
  USING (public.is_admin(auth.uid()));

CREATE POLICY "analytics_sources_update_admin" ON public.analytics_sources
  FOR UPDATE TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));
