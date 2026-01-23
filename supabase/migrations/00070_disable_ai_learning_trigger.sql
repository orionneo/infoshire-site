-- =============================================
-- CRITICAL FIX: Disable AI learning trigger
-- =============================================
-- The capture_ai_knowledge_event trigger was blocking service_order creation
-- by executing heavy queries inside an AFTER INSERT trigger.
-- This caused 60+ second timeouts when tab was backgrounded.
-- 
-- SOLUTION: Disable the trigger completely.
-- AI learning can be processed asynchronously via a scheduled job instead.
-- =============================================

-- Drop the trigger that was blocking inserts
DROP TRIGGER IF EXISTS trigger_capture_ai_knowledge ON public.service_orders;

-- Optionally, you can keep the function for manual execution later:
-- But the automatic trigger is disabled to unblock the admin creation flow.

COMMENT ON TRIGGER trigger_capture_ai_knowledge ON public.service_orders IS 'DISABLED - Was blocking service order creation. Use async processing instead.';
