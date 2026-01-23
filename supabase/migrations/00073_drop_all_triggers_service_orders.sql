-- =============================================
-- CRITICAL: Drop ALL remaining triggers on service_orders
-- =============================================
-- PROBLEM: The following BEFORE INSERT triggers were blocking:
-- 1. trigger_auto_generate_approval_token
-- 2. trigger_calculate_warranty_end_date
-- 
-- These execute BEFORE insert completes, blocking the operation
-- when tab is backgrounded (Firefox Tracking Prevention blocks SELECT queries)
--
-- SOLUTION: Drop all triggers completely
-- Approval token can be generated on frontend
-- Warranty calculation can be manual or async
-- =============================================

DROP TRIGGER IF EXISTS trigger_auto_generate_approval_token ON public.service_orders CASCADE;
DROP TRIGGER IF EXISTS trigger_calculate_warranty_end_date ON public.service_orders CASCADE;
DROP TRIGGER IF EXISTS trigger_update_completion_date ON public.service_orders CASCADE;

-- Verify result - should be empty
-- SELECT trigger_name FROM information_schema.triggers WHERE event_object_table = 'service_orders';
