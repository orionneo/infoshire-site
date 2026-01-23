-- =============================================
-- EMERGENCY: DROP ALL REMAINING TRIGGERS ON service_orders
-- =============================================
-- The following triggers are still blocking INSERT:
-- 1. trigger_auto_generate_approval_token
-- 2. trigger_calculate_warranty_end_date
-- These need to be disabled immediately to unblock OS creation
-- =============================================

-- Drop all triggers
DROP TRIGGER IF EXISTS trigger_auto_generate_approval_token ON public.service_orders CASCADE;
DROP TRIGGER IF EXISTS trigger_calculate_warranty_end_date ON public.service_orders CASCADE;
DROP TRIGGER IF EXISTS trigger_update_completion_date ON public.service_orders CASCADE;

-- Verify they're gone
SELECT trigger_name FROM information_schema.triggers 
WHERE event_object_table = 'service_orders';
-- Expected result: Empty (no rows)
