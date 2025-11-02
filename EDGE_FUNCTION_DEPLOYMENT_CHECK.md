# Edge Functions Deployment Verification

## Current Deployment Status

### Functions Used by Exam System
- ✅ `ai-proxy` - **REQUIRED** for exam generation (tool support)
- ⚠️ `ai-proxy-simple` - Basic chat only (NO tool support)

### Changes Made
1. **Database Schema**: Added missing columns to `exam_generations`
2. **Frontend**: Switched from `ai-proxy-simple` → `ai-proxy`
3. **Prompt Preview**: Added customization before generation

## Deployment Requirements

### 1. Check Current Deployment

```bash
# Using Supabase CLI
supabase functions list

# Expected output:
# Function Name     | Version | Created At
# ai-proxy          | 1       | 2025-xx-xx
# ai-proxy-simple   | 1       | 2025-xx-xx
```

### 2. Verify Edge Function is Deployed

**Via Supabase Dashboard:**
1. Go to https://supabase.com/dashboard
2. Select your project: `lvvvjywrmpcqrpvuptdi`
3. Navigate to **Edge Functions**
4. Check if `ai-proxy` is listed and deployed

**Expected Status:**
- ✅ `ai-proxy` - Status: **Active**
- ✅ Environment variables set:
  - `ANTHROPIC_API_KEY` or `SERVER_ANTHROPIC_API_KEY`

### 3. Test Edge Function

```bash
# Test ai-proxy is responding
curl -X POST \
  https://lvvvjywrmpcqrpvuptdi.supabase.co/functions/v1/ai-proxy \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "scope": "parent",
    "enable_tools": true,
    "payload": {
      "prompt": "Test prompt",
      "context": "test"
    }
  }'

# Expected response (not error):
{
  "content": "...",
  "tool_use": [...],
  "model": "claude-3-5-sonnet-20240620"
}
```

## Redeployment Needed?

### ✅ NO Redeploy Needed If:
- `ai-proxy` function already exists in Supabase Dashboard
- Function was deployed from `supabase/functions/ai-proxy/index.ts`
- No changes were made to the ai-proxy source code

### ⚠️ YES Redeploy Needed If:
- `ai-proxy` function doesn't exist (only `ai-proxy-simple`)
- Want to add diagram generation tool (from `DIAGRAM_GENERATION_PLAN.md`)
- Made changes to `supabase/functions/ai-proxy/index.ts`

## How to Deploy/Redeploy

### Method 1: Supabase CLI (Recommended)

```bash
# 1. Login to Supabase
npx supabase login

# 2. Link project
npx supabase link --project-ref lvvvjywrmpcqrpvuptdi

# 3. Deploy ai-proxy function
npx supabase functions deploy ai-proxy

# 4. Verify deployment
npx supabase functions list
```

### Method 2: Supabase Dashboard (Manual)

1. Go to https://supabase.com/dashboard
2. Select project
3. Navigate to **Edge Functions**
4. Click **New Function**
5. Name: `ai-proxy`
6. Copy entire content from `supabase/functions/ai-proxy/index.ts`
7. Click **Deploy**

### Method 3: GitHub Actions (CI/CD)

If you have GitHub Actions set up:
```yaml
# .github/workflows/deploy-functions.yml
- name: Deploy Edge Functions
  run: |
    npx supabase functions deploy ai-proxy
```

## Environment Variables Required

### Via Supabase Dashboard
1. Go to **Settings** → **Edge Functions**
2. Add/verify these variables:

| Variable Name | Required | Example Value |
|--------------|----------|---------------|
| `ANTHROPIC_API_KEY` | ✅ Yes | `sk-ant-api03-...` |
| `SERVER_ANTHROPIC_API_KEY` | ⚠️ Fallback | `sk-ant-api03-...` |
| `SUPABASE_SERVICE_ROLE_KEY` | ✅ Yes | Auto-set by Supabase |

**Get API Key:** https://console.anthropic.com/settings/keys

## Verification Checklist

After deployment (or to verify current state):

- [ ] Edge function `ai-proxy` shows as **Active** in dashboard
- [ ] Environment variable `ANTHROPIC_API_KEY` is set
- [ ] Test generation works:
  - [ ] Go to `/dashboard/parent`
  - [ ] Click exam prep widget
  - [ ] Select grade, subject, exam type
  - [ ] Click "Generate"
  - [ ] Review prompt preview modal appears
  - [ ] Click "Generate Exam"
  - [ ] Check browser console for success logs
  - [ ] Verify interactive exam displays

## Common Issues

### Issue: "FunctionsFetchError" in Console
**Cause:** Function not deployed  
**Fix:** Deploy using Method 1 above

### Issue: "500 Internal Server Error"
**Cause:** Missing ANTHROPIC_API_KEY  
**Fix:** Add environment variable in dashboard

### Issue: "Tool generate_caps_exam not available"
**Cause:** Using `ai-proxy-simple` instead of `ai-proxy`  
**Fix:** Already fixed in code (switched to `ai-proxy`)

### Issue: "Empty error object {}"
**Cause:** Database schema mismatch  
**Fix:** Already fixed (columns added via migration)

## Deployment Status for This Project

Based on code changes made:

**Code Changes:**
- ✅ Database schema updated (columns added)
- ✅ Frontend switched to use `ai-proxy`
- ✅ Prompt preview modal added
- ⚠️ **NO changes to edge function code**
- ❌ **Diagram generation NOT implemented** (only planned in DIAGRAM_GENERATION_PLAN.md)

**Current ai-proxy Status:**
- ✅ Supports `generate_caps_exam` tool (structured exams)
- ❌ **Still blocks diagram references** ("NO diagram references" in tool description)
- ❌ No `generate_diagram` tool implemented
- ⚠️ Visual questions (charts, shapes, number lines) will be **incomplete or rejected**

**Deployment Needed?**
- If `ai-proxy` already deployed: **NO** ✅ (for current functionality)
- If only `ai-proxy-simple` deployed: **YES** ⚠️ (to get structured exams)
- For diagram support: **YES** ⚠️ (requires implementing DIAGRAM_GENERATION_PLAN.md first)

**How to Check:**
1. Visit Supabase Dashboard → Edge Functions
2. Look for `ai-proxy` in list
3. If present → No deployment needed for current features
4. If missing → Deploy using Method 1
5. For diagrams → Implement plan first, then deploy

## Next Steps (For Diagram Support)

When ready to add diagram generation:

1. Update `supabase/functions/ai-proxy/index.ts` (see `DIAGRAM_GENERATION_PLAN.md`)
2. Redeploy: `npx supabase functions deploy ai-proxy`
3. Test with visual questions
4. Verify diagrams render correctly

---

**TL;DR:**
- **Check** Supabase Dashboard → Edge Functions
- **If `ai-proxy` exists** → No deployment needed ✅
- **If missing** → Deploy with `npx supabase functions deploy ai-proxy`
- **Test** by generating an exam and checking console logs
