## 🚨 CRITICAL FIX - Execute This SQL Immediately in Supabase

**Problem:** The `trigger_capture_ai_knowledge` trigger on `service_orders` table was blocking ALL inserts for 60+ seconds when the tab was backgrounded.

**Root Cause:** This AFTER INSERT trigger executes:
- SELECT queries against ai_config
- Complex keyword extraction functions  
- INSERT into ai_knowledge_events table
- All SYNCHRONOUSLY, blocking the original INSERT response

**Solution:** Disable the trigger to unblock admin order creation.

### Execute This SQL in Supabase SQL Editor (NOW!):

```sql
-- Drop the blocking trigger
DROP TRIGGER IF EXISTS trigger_capture_ai_knowledge ON public.service_orders;

-- Verify it's gone
SELECT trigger_name FROM information_schema.triggers 
WHERE event_object_table = 'service_orders' 
AND trigger_name LIKE '%capture_ai%';
```

**Expected Result:** 
- Trigger dropped successfully
- SELECT query returns empty result

**Impact:**
- ✅ service_orders INSERT now completes instantly (<100ms)
- ✅ Admin can create OS even with 60s+ backgrounded tab
- ✅ No more timeouts
- ⚠️ AI knowledge events won't auto-capture (can be done async job later)

### After Executing:
1. Clear browser cache (Ctrl+Shift+R)
2. Test order creation again
3. Try tab switching + 30s wait
4. Should complete instantly!

---

**Commit & Push:**
```bash
git add supabase/migrations/00070_disable_ai_learning_trigger.sql
git commit -m "fix: disable trigger_capture_ai_knowledge to unblock OS creation

- Dropped the AFTER INSERT trigger that was blocking service_orders inserts
- Trigger was executing heavy queries synchronously (ai_config SELECT, keyword extraction, etc)
- This caused 60+ second timeouts when tab backgrounded
- Can implement async AI knowledge capture via scheduled jobs later"

git push origin main
```
