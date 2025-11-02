# ? AI Model Fix - Wrong Model Name

**Error Found:** `model: claude-3-5-sonnet-20241022` - **not_found_error**

---

## ?? The Problem

The model name `claude-3-5-sonnet-20241022` doesn't exist in Anthropic's API.

---

## ? The Fix

Changed to valid model: `claude-3-5-sonnet-20240620`

**File:** `supabase/functions/ai-proxy-simple/index.ts`

**Before:**
```typescript
model: 'claude-3-5-sonnet-20241022'  // ? Doesn't exist
```

**After:**
```typescript
model: 'claude-3-5-sonnet-20240620'  // ? Valid model
```

---

## ?? Deploy Fixed Version

```bash
cd supabase/functions
supabase functions deploy ai-proxy-simple
```

**Or in Supabase Dashboard:**
1. Edge Functions ? ai-proxy-simple
2. Update code (line 52)
3. Click **Deploy**

---

## ?? Valid Claude Models

### **Latest (Recommended):**
- `claude-3-5-sonnet-20240620` ? **Using this**
- `claude-3-opus-20240229`
- `claude-3-sonnet-20240229`
- `claude-3-haiku-20240307`

### **Legacy:**
- `claude-2.1`
- `claude-2.0`
- `claude-instant-1.2`

---

## ? After Deploying

1. **Refresh your browser**
2. **Try Dash AI again**
3. **Should work now!** ??

---

**The fix is ready - just redeploy the function!** ??
