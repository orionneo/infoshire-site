-- =============================================
-- FIX: Replace is_admin() with proper admin email check in all RLS policies
-- =============================================
-- PROBLEM: 
-- - is_admin() function was changed to always return false
-- - But many RLS policies still call is_admin()
-- - This blocks all admin operations (analytics, email config, etc)
-- - Admin@infoshire.com.br cannot read/write admin tables
--
-- SOLUTION:
-- - Replace is_admin() calls with direct admin email check
-- - Check email against known admin emails in metadata
-- =============================================

-- First, update the is_admin() function to actually check admin role
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

-- Now fix all policies that use is_admin()
-- =============================================
-- ANALYTICS EVENTS POLICIES
-- =============================================
DROP POLICY IF EXISTS "analytics_events_delete_admin" ON public.analytics_events;
DROP POLICY IF EXISTS "analytics_events_select_admin" ON public.analytics_events;
DROP POLICY IF EXISTS "analytics_events_update_admin" ON public.analytics_events;

CREATE POLICY "analytics_events_delete_admin"
  ON public.analytics_events FOR DELETE TO authenticated
  USING (public.is_admin(auth.uid()));

CREATE POLICY "analytics_events_select_admin"
  ON public.analytics_events FOR SELECT TO authenticated
  USING (public.is_admin(auth.uid()));

CREATE POLICY "analytics_events_update_admin"
  ON public.analytics_events FOR UPDATE TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

-- =============================================
-- ANALYTICS PAGEVIEWS POLICIES
-- =============================================
DROP POLICY IF EXISTS "analytics_pageviews_delete_admin" ON public.analytics_pageviews;
DROP POLICY IF EXISTS "analytics_pageviews_select_admin" ON public.analytics_pageviews;
DROP POLICY IF EXISTS "analytics_pageviews_update_admin" ON public.analytics_pageviews;

CREATE POLICY "analytics_pageviews_delete_admin"
  ON public.analytics_pageviews FOR DELETE TO authenticated
  USING (public.is_admin(auth.uid()));

CREATE POLICY "analytics_pageviews_select_admin"
  ON public.analytics_pageviews FOR SELECT TO authenticated
  USING (public.is_admin(auth.uid()));

CREATE POLICY "analytics_pageviews_update_admin"
  ON public.analytics_pageviews FOR UPDATE TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

-- =============================================
-- ANALYTICS SESSIONS POLICIES
-- =============================================
DROP POLICY IF EXISTS "analytics_sessions_delete_admin" ON public.analytics_sessions;
DROP POLICY IF EXISTS "analytics_sessions_select_admin" ON public.analytics_sessions;
DROP POLICY IF EXISTS "analytics_sessions_update_admin" ON public.analytics_sessions;

CREATE POLICY "analytics_sessions_delete_admin"
  ON public.analytics_sessions FOR DELETE TO authenticated
  USING (public.is_admin(auth.uid()));

CREATE POLICY "analytics_sessions_select_admin"
  ON public.analytics_sessions FOR SELECT TO authenticated
  USING (public.is_admin(auth.uid()));

CREATE POLICY "analytics_sessions_update_admin"
  ON public.analytics_sessions FOR UPDATE TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

-- =============================================
-- ANALYTICS SOURCES POLICIES
-- =============================================
DROP POLICY IF EXISTS "analytics_sources_delete_admin" ON public.analytics_sources;
DROP POLICY IF EXISTS "analytics_sources_select_admin" ON public.analytics_sources;
DROP POLICY IF EXISTS "analytics_sources_update_admin" ON public.analytics_sources;

CREATE POLICY "analytics_sources_delete_admin"
  ON public.analytics_sources FOR DELETE TO authenticated
  USING (public.is_admin(auth.uid()));

CREATE POLICY "analytics_sources_select_admin"
  ON public.analytics_sources FOR SELECT TO authenticated
  USING (public.is_admin(auth.uid()));

CREATE POLICY "analytics_sources_update_admin"
  ON public.analytics_sources FOR UPDATE TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

-- =============================================
-- MESSAGES POLICIES
-- =============================================
DROP POLICY IF EXISTS "messages_delete_admin_only" ON public.messages;
DROP POLICY IF EXISTS "messages_update_admin_only" ON public.messages;

CREATE POLICY "messages_delete_admin_only"
  ON public.messages FOR DELETE TO authenticated
  USING (public.is_admin(auth.uid()));

CREATE POLICY "messages_update_admin_only"
  ON public.messages FOR UPDATE TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

-- =============================================
-- ORDER IMAGES POLICIES
-- =============================================
DROP POLICY IF EXISTS "order_images_delete_admin_only" ON public.order_images;
DROP POLICY IF EXISTS "order_images_update_admin_only" ON public.order_images;

CREATE POLICY "order_images_delete_admin_only"
  ON public.order_images FOR DELETE TO authenticated
  USING (public.is_admin(auth.uid()));

CREATE POLICY "order_images_update_admin_only"
  ON public.order_images FOR UPDATE TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

-- =============================================
-- SERVICE ORDER ITEMS POLICIES
-- =============================================
DROP POLICY IF EXISTS "service_order_items_delete_admin_only" ON public.service_order_items;
DROP POLICY IF EXISTS "service_order_items_update_admin_only" ON public.service_order_items;

CREATE POLICY "service_order_items_delete_admin_only"
  ON public.service_order_items FOR DELETE TO authenticated
  USING (public.is_admin(auth.uid()));

CREATE POLICY "service_order_items_update_admin_only"
  ON public.service_order_items FOR UPDATE TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

-- =============================================
-- ORDER STATUS HISTORY POLICIES
-- =============================================
DROP POLICY IF EXISTS "order_status_history_select_admin" ON public.order_status_history;
DROP POLICY IF EXISTS "order_status_history_write_admin_only" ON public.order_status_history;

CREATE POLICY "order_status_history_select_admin"
  ON public.order_status_history FOR SELECT TO authenticated
  USING (public.is_admin(auth.uid()));

CREATE POLICY "order_status_history_write_admin_only"
  ON public.order_status_history FOR ALL TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

-- =============================================
-- MESSAGES ORIGINAL POLICY (from 00001)
-- =============================================
DROP POLICY IF EXISTS "Admins have full access to messages" ON public.messages;

-- =============================================
-- SITE SETTINGS POLICY (from 00001)
-- =============================================
DROP POLICY IF EXISTS "Admins can manage site_settings" ON public.site_settings;

CREATE POLICY "Admins can manage site_settings" ON public.site_settings
  FOR ALL TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));
