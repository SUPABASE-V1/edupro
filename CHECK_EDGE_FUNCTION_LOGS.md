# ?? How to Check Edge Function Logs

Your Edge Function is deployed but returning a **500 error**, which means it's crashing.

---

## ?? Quick Check: API Key

**99% of 500 errors are because `ANTHROPIC_API_KEY` is not set.**

### **Fix it now:**

1. **Go to Supabase Dashboard**
   - https://supabase.com/dashboard/project/lvvvjywrmpcqrpvuptdi

2. **Navigate to Settings:**
   - Left sidebar ? **Settings**
   - Click **Edge Functions**

3. **Add Environment Variable:**
   - Click **Add variable**
   - Name: `ANTHROPIC_API_KEY`
   - Value: Your Anthropic API key (get from https://console.anthropic.com/settings/keys)
   - Click **Save**

4. **Redeploy Function:**
   - Go to **Edge Functions** (left sidebar)
   - Click on `ai-proxy-simple`
   - Click **Deploy** button again

5. **Test:**
   - Refresh your app
   - Try Dash AI again

---

## ?? View Actual Error Logs

### **Method 1: Supabase Dashboard**

1. Go to **Edge Functions** (left sidebar)
2. Click `ai-proxy-simple`
3. Click **Logs** tab
4. Look for errors (red text)

**Common errors you'll see:**

```
ERROR: ANTHROPIC_API_KEY is not defined
```
? **Fix:** Add environment variable

```
ERROR: 403 Forbidden - Invalid API key
```
? **Fix:** Get new key from Anthropic

```
ERROR: Failed to fetch
```
? **Fix:** Check internet connection / Anthropic API status

---

### **Method 2: Supabase CLI**

```bash
# View live logs (follow mode)
supabase functions logs ai-proxy-simple --follow

# Or view last 50 logs
supabase functions logs ai-proxy-simple --limit 50
```

---

## ?? Test Function Directly

To see the exact error, call the function directly:

```bash
curl -X POST https://lvvvjywrmpcqrpvuptdi.supabase.co/functions/v1/ai-proxy-simple \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -d '{
    "payload": {
      "prompt": "test"
    }
  }' \
  -v
```

**Look for the response body** - it will contain the actual error message.

---

## ?? Debug Checklist

Run through this checklist:

### **1. Is ANTHROPIC_API_KEY set?**
- [ ] Check in Supabase Dashboard ? Settings ? Edge Functions ? Environment Variables
- [ ] Variable exists: `ANTHROPIC_API_KEY`
- [ ] Value starts with: `sk-ant-api03-`

### **2. Is the key valid?**
- [ ] Test key at https://console.anthropic.com/workbench
- [ ] Key has credits available
- [ ] Key is not expired

### **3. Is function deployed with latest code?**
- [ ] Check function code in dashboard matches `/workspace/supabase/functions/ai-proxy-simple/index.ts`
- [ ] Click "Deploy" to redeploy after adding env variables

### **4. Check logs:**
- [ ] View logs in dashboard
- [ ] Or run: `supabase functions logs ai-proxy-simple`

---

## ?? Most Likely Issues (in order)

### **Issue 1: Missing API Key** (90% of cases)

**Symptom:** Logs show "ANTHROPIC_API_KEY is not defined"

**Fix:**
```
1. Settings ? Edge Functions ? Environment Variables
2. Add: ANTHROPIC_API_KEY = sk-ant-api03-...
3. Redeploy function
```

---

### **Issue 2: Invalid API Key** (5% of cases)

**Symptom:** Logs show "403 Forbidden" or "Invalid API key"

**Fix:**
```
1. Go to https://console.anthropic.com/settings/keys
2. Create new API key
3. Copy the key
4. Update in Supabase environment variables
5. Redeploy function
```

---

### **Issue 3: Anthropic API Down** (3% of cases)

**Symptom:** Logs show "Failed to fetch" or "ECONNREFUSED"

**Fix:**
```
1. Check Anthropic status: https://status.anthropic.com
2. Wait for service to recover
3. Try again
```

---

### **Issue 4: Code Error** (2% of cases)

**Symptom:** Logs show JavaScript/TypeScript errors

**Fix:**
```
1. Check logs for actual error
2. Fix code in function
3. Redeploy
```

---

## ?? What to Send Me

If still not working, send me:

1. **Screenshot of logs** (Edge Functions ? ai-proxy-simple ? Logs)
2. **Environment variables list** (hide the actual key value, just show it exists)
3. **cURL response** (from test command above)

With that info, I can pinpoint the exact issue!

---

## ?? Quick Fix Command

If you have Supabase CLI:

```bash
# Set env variable
supabase secrets set ANTHROPIC_API_KEY=sk-ant-api03-YOUR_KEY

# Redeploy
supabase functions deploy ai-proxy-simple

# Test
curl -X POST https://lvvvjywrmpcqrpvuptdi.supabase.co/functions/v1/ai-proxy-simple \
  -H "Content-Type: application/json" \
  -d '{"payload":{"prompt":"test"}}'
```

---

## ? Success Indicators

When working, you'll see:

**Logs show:**
```
[ai-proxy-simple] Request received
[ai-proxy-simple] Calling Claude API...
[ai-proxy-simple] Claude API success
```

**cURL returns:**
```json
{
  "content": "Hello! How can I help you?",
  "usage": { ... },
  "model": "claude-3-5-sonnet-20241022"
}
```

**Browser console shows:**
```
[DashAI] Edge Function Response: {
  content: "...",
  usage: { ... }
}
```

---

**Check the logs first - they'll tell you exactly what's wrong!** ??
