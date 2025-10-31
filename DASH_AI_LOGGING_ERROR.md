# 🚨 Dash AI Logging Error - 400 Bad Request

**Error**: POST to `ai_usage_logs` returns 400  
**Impact**: AI works but usage isn't logged (no tracking/quotas)

---

## 🔍 Root Cause

The Edge Function (`ai-proxy`) is trying to insert data into `ai_usage_logs`, but the **data doesn't match the table schema**.

### What Edge Function Sends:
```typescript
{
  user_id: user.id,                    // ✅ UUID
  preschool_id: organizationId,        // ✅ UUID (legacy field)
  organization_id: organizationId,     // ✅ UUID
  service_type: service_type,          // ✅ TEXT
  ai_model_used: aiResult.model,       // ✅ TEXT
  status: 'success',                   // ✅ TEXT
  input_tokens: aiResult.tokensIn,     // ✅ INTEGER
  output_tokens: aiResult.tokensOut,   // ✅ INTEGER
  total_cost: cost,                    // ✅ DECIMAL
  processing_time_ms: processingTime,  // ✅ INTEGER
  system_prompt: systemPrompt,         // ✅ TEXT
  input_text: redactedInput,           // ✅ TEXT
  output_text: redactedOutput,         // ✅ TEXT
  metadata: { ... },                   // ✅ JSONB
  request_id: requestId                // ✅ TEXT
}
```

### What Table Expects (from schema):
```sql
CREATE TABLE public.ai_usage_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Service and model
  ai_service_id TEXT REFERENCES public.ai_services (id),  -- ⚠️ REFERENCES ai_services!
  ai_model_used TEXT NOT NULL,
  
  -- User and organization  
  user_id UUID NOT NULL REFERENCES auth.users (id),
  organization_id UUID REFERENCES public.preschools (id),
  preschool_id UUID REFERENCES public.preschools (id),
  
  -- Other fields...
  ...
);
```

---

## ❌ The Issue

**Field**: `ai_service_id TEXT REFERENCES public.ai_services (id)`

The Edge Function is NOT sending `ai_service_id`, but the table might require it (foreign key constraint).

**Possible causes**:
1. Missing `ai_service_id` field (Edge Function doesn't send it)
2. Invalid foreign key reference (if sent, doesn't exist in `ai_services`)
3. RLS policy blocking insert (though using service_role)
4. Other required fields missing

---

## ✅ Solution

### Option 1: Make `ai_service_id` Nullable (Quick Fix)

Run this SQL via Supabase Dashboard:

```sql
-- Make ai_service_id nullable so it's optional
ALTER TABLE public.ai_usage_logs 
ALTER COLUMN ai_service_id DROP NOT NULL;

-- Optionally drop the foreign key constraint
ALTER TABLE public.ai_usage_logs 
DROP CONSTRAINT IF EXISTS ai_usage_logs_ai_service_id_fkey;
```

**Why**: The Edge Function doesn't lookup/send the `ai_service_id`, so make it optional.

---

### Option 2: Update Edge Function to Send ai_service_id (Proper Fix)

**File**: `supabase/functions/ai-proxy/index.ts`

Find where it inserts into `ai_usage_logs` (line ~950, 998, 1235, 1305) and add:

```typescript
// Before insert, lookup ai_service_id
const { data: aiService } = await supabaseAdmin
  .from('ai_services')
  .select('id')
  .eq('model_version', aiResult.model)
  .single();

const ai_service_id = aiService?.id || null;

// Then in insert:
.insert({
  ai_service_id: ai_service_id,  // ✅ Add this
  user_id: user.id,
  preschool_id: organizationId,
  // ... rest of fields
})
```

**Why**: Properly link usage logs to the AI service used.

---

## 🧪 Test the Fix

### After Option 1 (Quick Fix):
1. Run the SQL to make field nullable
2. Try using Dash AI again
3. Check Supabase logs - should see 200 OK

### After Option 2 (Proper Fix):
1. Update Edge Function code
2. Deploy: `supabase functions deploy ai-proxy`
3. Test Dash AI
4. Verify `ai_service_id` is populated in `ai_usage_logs`

---

## 🔍 How to Debug Further

### Check actual error from PostgreSQL:

Run this in Supabase Dashboard SQL Editor:

```sql
-- Try manual insert to see exact error
INSERT INTO public.ai_usage_logs (
  user_id,
  organization_id,
  preschool_id,
  service_type,
  ai_model_used,
  status,
  input_tokens,
  output_tokens,
  total_cost
) VALUES (
  'cc7e4eb1-7e7c-4af7-94d2-f1e719616967',  -- Replace with real user ID
  'ba79097c-1b93-4b48-bcbe-df73878ab4d1',  -- Replace with real preschool ID
  'ba79097c-1b93-4b48-bcbe-df73878ab4d1',
  'homework_help',
  'claude-3-5-sonnet-20241022',
  'success',
  100,
  200,
  0.045
);
```

**Expected**: Shows exact constraint/error that's failing.

---

### Check ai_services table:

```sql
SELECT id, name, model_version 
FROM public.ai_services 
WHERE provider = 'anthropic';
```

**Expected**: Should see Claude models with their IDs.

---

### Check current table constraints:

```sql
SELECT
  tc.constraint_name,
  tc.constraint_type,
  kcu.column_name
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu
  ON tc.constraint_name = kcu.constraint_name
WHERE tc.table_name = 'ai_usage_logs'
  AND tc.table_schema = 'public';
```

**Expected**: Shows all constraints on `ai_usage_logs`.

---

## 📋 Quick Fix Script

Run this via Supabase Dashboard → SQL Editor:

```sql
-- ================================================================
-- Quick Fix: Make ai_service_id optional
-- ================================================================

BEGIN;

-- Remove NOT NULL constraint
ALTER TABLE public.ai_usage_logs 
ALTER COLUMN ai_service_id DROP NOT NULL;

-- Optionally drop foreign key (if causing issues)
ALTER TABLE public.ai_usage_logs 
DROP CONSTRAINT IF EXISTS ai_usage_logs_ai_service_id_fkey;

-- Verify change
SELECT 
  column_name,
  is_nullable,
  data_type
FROM information_schema.columns
WHERE table_name = 'ai_usage_logs'
  AND column_name = 'ai_service_id';

COMMIT;

-- Test insert
INSERT INTO public.ai_usage_logs (
  user_id,
  preschool_id,
  organization_id,
  service_type,
  ai_model_used,
  status,
  input_tokens,
  output_tokens,
  total_cost
) VALUES (
  auth.uid(),  -- Your user ID
  (SELECT preschool_id FROM profiles WHERE id = auth.uid() LIMIT 1),
  (SELECT preschool_id FROM profiles WHERE id = auth.uid() LIMIT 1),
  'homework_help',
  'claude-3-5-sonnet-20241022',
  'success',
  50,
  100,
  0.025
);

-- Cleanup test
DELETE FROM public.ai_usage_logs 
WHERE service_type = 'homework_help' 
  AND created_at > NOW() - INTERVAL '1 minute';
```

---

## ✅ Recommendation

**Run Option 1 (Quick Fix) NOW** to unblock AI usage logging immediately.

Then **schedule Option 2 (Proper Fix)** for next deployment to properly link AI services.

---

**Status**: ⚠️ **AI works but usage not logged**  
**Fix**: Run quick fix SQL above  
**Priority**: Medium (affects quotas/billing tracking)
