# ?? Switch to Simplified AI Proxy

The complex `ai-proxy` function requires database tables (`ai_usage_logs`, quota columns, etc.) that may not be set up yet.

Use this **simplified version** to get AI working immediately, then add features back later.

---

## ?? What's Different

### **ai-proxy** (Complex - 1361 lines)
- ? Requires `ai_usage_logs` table
- ? Quota checks
- ? Usage logging
- ? Tool execution
- ? Multiple dependencies

### **ai-proxy-simple** (Simple - 100 lines)
- ? No database dependencies
- ? No quota checks
- ? No logging (just console)
- ? Direct Claude API call
- ? Minimal code

---

## ?? Deploy Simplified Version

### **Option 1: Supabase CLI**

```bash
# From workspace root
cd supabase/functions
supabase functions deploy ai-proxy-simple

# Test it
curl -X POST https://lvvvjywrmpcqrpvuptdi.supabase.co/functions/v1/ai-proxy-simple \
  -H "Content-Type: application/json" \
  -d '{
    "payload": {
      "prompt": "Hello, test message"
    }
  }'
```

---

### **Option 2: Supabase Dashboard**

1. Go to **Functions** in Supabase Dashboard
2. Click **Create Function**
3. Name: `ai-proxy-simple`
4. Copy contents from `/workspace/supabase/functions/ai-proxy-simple/index.ts`
5. Click **Deploy**

---

## ?? Update Frontend to Use Simple Version

### **Option A: Change Function Name (Recommended)**

**File:** `web/src/components/dashboard/AskAIWidget.tsx`

```typescript
// Change from:
const { data, error } = await supabase.functions.invoke('ai-proxy', {

// To:
const { data, error } = await supabase.functions.invoke('ai-proxy-simple', {
```

**Do this in 2 places** (lines ~96 and ~216)

---

### **Option B: Rename Function in Supabase**

1. Deploy `ai-proxy-simple` as `ai-proxy` (overwrite old one)
2. No frontend changes needed

---

## ? Quick Fix Steps

### **1. Deploy Simple Function**

```bash
cd supabase/functions
supabase functions deploy ai-proxy-simple
```

### **2. Update AskAIWidget.tsx**

Find these 2 lines:
```typescript
supabase.functions.invoke('ai-proxy', {
```

Change to:
```typescript
supabase.functions.invoke('ai-proxy-simple', {
```

### **3. Test**

Refresh page, send message to Dash AI:
- ? Should get response from Claude
- ? No 500 error
- ? Console shows success logs

---

## ?? What Works

### **Features in Simple Version:**
- ? Claude AI responses
- ? CAPS context awareness
- ? Multi-language support (metadata)
- ? Error handling
- ? CORS headers
- ? Console logging

### **Features NOT in Simple Version:**
- ? Quota enforcement
- ? Usage tracking
- ? Tool execution (database queries)
- ? Interactive exam parsing
- ? Cost tracking

---

## ?? Later: Add Features Back

Once AI is working, you can gradually add features:

### **Step 1: Add Usage Logging**

Create table:
```sql
CREATE TABLE ai_usage_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  service_type TEXT NOT NULL,
  tokens_used INTEGER,
  cost NUMERIC(10, 6),
  status TEXT DEFAULT 'success',
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

Add to function:
```typescript
// After successful API call
await supabaseAdmin.from('ai_usage_logs').insert({
  user_id: userId,
  service_type: 'homework_help',
  tokens_used: data.usage.total_tokens,
  cost: calculateCost(data.usage),
  status: 'success'
})
```

---

### **Step 2: Add Quota Checks**

Add columns to profiles:
```sql
ALTER TABLE profiles ADD COLUMN quota_homework_help INTEGER DEFAULT 15;
```

Add check:
```typescript
const { data: usage } = await supabase
  .from('ai_usage_logs')
  .select('id')
  .eq('user_id', userId)
  .gte('created_at', startOfMonth)
  
if (usage.length >= userQuota) {
  return { error: 'Quota exceeded' }
}
```

---

### **Step 3: Add Tool Execution**

Define tools and add to Claude API call:
```typescript
tools: [{
  name: 'query_database',
  description: 'Query student data',
  input_schema: { ... }
}]
```

---

## ?? Test Simple Version

### **1. Check Function Deployed:**

```bash
supabase functions list
# Should see: ai-proxy-simple
```

---

### **2. Test Direct Call:**

```javascript
// In browser console
const supabase = createClient();
const { data, error } = await supabase.functions.invoke('ai-proxy-simple', {
  body: {
    payload: {
      prompt: 'Hello, this is a test',
      context: 'test',
      metadata: { language: 'en-ZA' }
    }
  }
});

console.log('Result:', { data, error });
```

**Expected:**
```json
{
  "data": {
    "content": "Hello! I'm here to help...",
    "usage": { "input_tokens": 50, "output_tokens": 30 },
    "model": "claude-3-5-sonnet-20241022"
  },
  "error": null
}
```

---

### **3. Test via UI:**

1. Refresh dashboard
2. Send message in Dash AI
3. Should get response!

---

## ?? Files Created

1. **`supabase/functions/ai-proxy-simple/index.ts`** (100 lines)
   - Minimal working AI proxy
   - No database dependencies
   - Direct Claude API

2. **`SWITCH_TO_SIMPLE_AI_PROXY.md`** (This file)
   - Instructions
   - Migration path

---

## ?? Decision Tree

```
Do you need quota enforcement NOW?
?? YES ? Fix ai_usage_logs table schema, use ai-proxy
?? NO  ? Use ai-proxy-simple, add features later

Do you need usage tracking NOW?
?? YES ? Fix ai_usage_logs table schema, use ai-proxy
?? NO  ? Use ai-proxy-simple, add features later

Do you need tool execution NOW?
?? YES ? Use full ai-proxy, fix database
?? NO  ? Use ai-proxy-simple for now

Do you just want AI to work?
?? YES ? Use ai-proxy-simple! ?
```

---

## ? Fastest Path to Working AI

```bash
# 1. Deploy simple function (2 minutes)
cd supabase/functions
supabase functions deploy ai-proxy-simple

# 2. Update frontend (1 minute)
# Change 'ai-proxy' to 'ai-proxy-simple' in AskAIWidget.tsx

# 3. Test (30 seconds)
# Refresh page, send message

# ? AI WORKING!
```

---

## ?? Troubleshooting Simple Version

### **Still getting 500?**

Check logs:
```bash
supabase functions logs ai-proxy-simple
```

Common issues:
- `ANTHROPIC_API_KEY not set` ? Set in environment variables
- `403 Forbidden` ? Invalid API key
- `429 Too Many Requests` ? Rate limit (wait a bit)

---

### **Getting "No response"?**

Check console:
```javascript
// Should see:
[ai-proxy-simple] Request received
[ai-proxy-simple] Calling Claude API...
[ai-proxy-simple] Claude API success
```

If you see error, check the API key format.

---

## ?? Success Indicators

When working correctly:

**Console shows:**
```
[DashAI] Edge Function Response: {
  content: "I'd be happy to help...",
  usage: { input_tokens: 123, output_tokens: 456 },
  model: "claude-3-5-sonnet-20241022"
}
```

**UI shows:**
- User message (purple, right)
- AI response (dark, left, markdown formatted)
- No error messages

---

**Use the simple version to get AI working NOW, then add features back later!** ??
