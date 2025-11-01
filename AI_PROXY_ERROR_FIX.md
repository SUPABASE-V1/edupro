# ?? AI Proxy 500 Error - Troubleshooting Guide

**Error:** `POST /functions/v1/ai-proxy 500 (Internal Server Error)`

---

## ?? Problem

The `ai-proxy` Edge Function is returning a 500 error, which means the backend is crashing.

---

## ?? Common Causes

### **1. Missing Environment Variables** (Most Common)

The Edge Function requires:
- `ANTHROPIC_API_KEY`
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

**Fix:**
```bash
# In Supabase Dashboard:
# Settings > Edge Functions > Environment Variables

# Add:
ANTHROPIC_API_KEY=sk-ant-api03-...
SUPABASE_URL=https://lvvvjywrmpcqrpvuptdi.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJh...
```

---

### **2. Edge Function Not Deployed**

**Fix:**
```bash
# Deploy the function
cd supabase
supabase functions deploy ai-proxy

# Or in Supabase Dashboard:
# Functions > ai-proxy > Deploy
```

---

### **3. Missing Database Tables/Functions**

The Edge Function needs:
- `ai_usage_logs` table
- `profiles` table with quota columns

**Check:**
```sql
-- In Supabase SQL Editor
SELECT * FROM ai_usage_logs LIMIT 1;
SELECT quota_lesson_generation, quota_homework_help 
FROM profiles 
LIMIT 1;
```

---

### **4. Quota Check Failing**

**Temporary Bypass (for testing):**

Edit `supabase/functions/ai-proxy/index.ts`:

```typescript
// TEMP: Skip quota check for testing
const quotaCheck = { allowed: true }; 
// const quotaCheck = await checkQuota(...);  // Comment out
```

---

## ?? Quick Fix (Development Mode)

### **Option 1: Disable AI Proxy (Test UI)**

```bash
# web/.env.local
NEXT_PUBLIC_AI_PROXY_ENABLED=false
```

**Result:** UI works, but AI won't respond

---

### **Option 2: Mock Response (Frontend)**

Edit `AskAIWidget.tsx`:

```typescript
// TEMP: Mock response for testing
if (process.env.NODE_ENV === 'development') {
  setMessages((m) => [...m, { 
    role: 'assistant', 
    text: '?? **Development Mode**\n\nThis is a mock response. The AI service is being configured.\n\nOnce the `ai-proxy` Edge Function is deployed with proper environment variables, you\'ll get real AI responses here.' 
  }]);
  setLoading(false);
  return;
}
```

---

## ?? Step-by-Step Fix

### **Step 1: Check Edge Function Logs**

```bash
# In Supabase Dashboard:
Functions > ai-proxy > Logs

# Look for errors like:
# - "ANTHROPIC_API_KEY is not defined"
# - "Failed to connect to database"
# - "Table 'ai_usage_logs' does not exist"
```

---

### **Step 2: Set Environment Variables**

```bash
# Supabase Dashboard:
Settings > Edge Functions > Environment Variables

# Required:
ANTHROPIC_API_KEY=sk-ant-api03-YOUR_KEY_HERE

# Get your Anthropic API key:
# https://console.anthropic.com/settings/keys
```

---

### **Step 3: Deploy Edge Function**

```bash
# Using Supabase CLI:
cd supabase
supabase functions deploy ai-proxy

# Or via Dashboard:
Functions > ai-proxy > Deploy
```

---

### **Step 4: Test Edge Function**

```typescript
// In browser console:
const test = await supabase.functions.invoke('ai-proxy', {
  body: {
    scope: 'parent',
    service_type: 'homework_help',
    payload: {
      prompt: 'Hello, test message',
      context: 'test'
    }
  }
});

console.log('Test result:', test);
```

**Expected:**
```json
{
  "data": {
    "content": "Hello! How can I help you today?"
  },
  "error": null
}
```

---

## ?? Alternative: Use Different LLM Provider

If Anthropic is causing issues, you can switch to OpenAI:

### **Edit Edge Function:**

```typescript
// supabase/functions/ai-proxy/index.ts

// Change from Anthropic:
const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY')

// To OpenAI:
const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY')

// Update API call to use OpenAI format
const response = await fetch('https://api.openai.com/v1/chat/completions', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${OPENAI_API_KEY}`
  },
  body: JSON.stringify({
    model: 'gpt-4',
    messages: [{ role: 'user', content: prompt }]
  })
});
```

---

## ?? Debugging Steps

### **1. Check Function Status:**

```bash
supabase functions list
```

### **2. View Logs:**

```bash
supabase functions logs ai-proxy
```

### **3. Test Locally:**

```bash
cd supabase
supabase functions serve ai-proxy

# In another terminal:
curl -X POST http://localhost:54321/functions/v1/ai-proxy \
  -H "Content-Type: application/json" \
  -d '{
    "scope": "parent",
    "service_type": "homework_help",
    "payload": { "prompt": "test" }
  }'
```

---

## ?? Updated AskAIWidget.tsx

I've updated the component to:
- ? Log detailed errors
- ? Show error messages to user
- ? Provide troubleshooting steps
- ? Log response data for debugging

**Test it now:**
1. Refresh page
2. Try sending a message
3. Check browser console for detailed error logs
4. Error message will show specific issue

---

## ?? For Development (Temporary)

Add this to `AskAIWidget.tsx` before the API call:

```typescript
// DEVELOPMENT MODE: Mock AI response
if (!ENABLED || process.env.NODE_ENV === 'development') {
  setTimeout(() => {
    setMessages((m) => [...m, { 
      role: 'assistant', 
      text: `## ?? Development Mode

This is a **mock response** because the AI service is not fully configured yet.

### What's needed:
1. Deploy \`ai-proxy\` Edge Function
2. Set \`ANTHROPIC_API_KEY\` environment variable
3. Ensure database tables exist

### Current Status:
- ? UI is working
- ? Styling complete
- ? Backend needs configuration

Once configured, you'll get real AI responses here!`
    }]);
    setLoading(false);
  }, 1000);
  return;
}
```

---

## ? Checklist

Before AI works, ensure:
- [ ] `ai-proxy` Edge Function deployed
- [ ] `ANTHROPIC_API_KEY` environment variable set
- [ ] `SUPABASE_URL` environment variable set
- [ ] `SUPABASE_SERVICE_ROLE_KEY` environment variable set
- [ ] Database tables exist (`ai_usage_logs`, `profiles`)
- [ ] Edge Function logs show no errors
- [ ] Test API call returns 200 status

---

## ?? Quick Test

Run this in browser console after page loads:

```javascript
// Check if AI is enabled
console.log('AI Proxy Enabled:', 
  process.env.NEXT_PUBLIC_AI_PROXY_ENABLED);

// Test function availability
const testAI = async () => {
  const supabase = createClient();
  const { data, error } = await supabase.functions.invoke('ai-proxy', {
    body: {
      scope: 'parent',
      service_type: 'homework_help',
      payload: { prompt: 'Hello' }
    }
  });
  console.log('AI Test:', { data, error });
};

testAI();
```

---

## ?? If Still Failing

1. **Check Supabase Dashboard:**
   - Functions > ai-proxy > Logs
   - Look for the actual error

2. **Check Environment:**
   - Settings > Edge Functions > Environment Variables
   - Verify all 3 variables are set

3. **Check Database:**
   - SQL Editor > Run:
   ```sql
   SELECT table_name FROM information_schema.tables 
   WHERE table_name = 'ai_usage_logs';
   ```

4. **Simplify Function:**
   - Remove quota checks temporarily
   - Return mock response to isolate issue

---

## ?? Expected Behavior After Fix

**User sends:** "Help with Math"
**AI responds:** *Actual helpful response about Math*

**Console shows:**
```
[DashAI] Edge Function Response: {
  content: "I'd be happy to help with Math! What specific topic...",
  usage: { tokens: 245, cost: 0.003 }
}
```

---

**Refresh the page and check the console for detailed error information!** ??
