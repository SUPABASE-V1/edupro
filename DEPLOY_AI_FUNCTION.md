# ?? Deploy AI Function - Step by Step

**Error:** `FunctionsFetchError` means the Edge Function doesn't exist yet.

---

## ? Quick Deploy (Choose One Method)

### **Method 1: Supabase CLI** (Recommended)

```bash
# 1. Navigate to functions directory
cd supabase/functions

# 2. Deploy the function
supabase functions deploy ai-proxy-simple

# 3. Verify deployment
supabase functions list
# Should show: ai-proxy-simple
```

**Expected output:**
```
Deploying Function ai-proxy-simple (project ref: lvvvjywrmpcqrpvuptdi)
? Function ai-proxy-simple deployed successfully
```

---

### **Method 2: Supabase Dashboard**

1. **Go to your Supabase project:**
   - https://supabase.com/dashboard/project/lvvvjywrmpcqrpvuptdi

2. **Navigate to Functions:**
   - Left sidebar ? **Edge Functions**

3. **Create New Function:**
   - Click **Create a new function**
   - Name: `ai-proxy-simple`
   - Click **Create function**

4. **Add Code:**
   - Copy entire contents from `/workspace/supabase/functions/ai-proxy-simple/index.ts`
   - Paste into code editor
   - Click **Deploy**

5. **Verify:**
   - Should see green "Deployed" status

---

## ?? Set Environment Variable

**IMPORTANT:** After deploying, set the API key:

### **In Supabase Dashboard:**

1. Go to **Settings** ? **Edge Functions** ? **Environment Variables**

2. Click **Add variable**

3. Add:
   ```
   Name:  ANTHROPIC_API_KEY
   Value: sk-ant-api03-YOUR_KEY_HERE
   ```

4. Click **Save**

5. **Redeploy** the function (click Deploy again)

---

## ?? Test Deployment

### **Test 1: Check Function Exists**

```bash
supabase functions list
```

**Should show:**
```
???????????????????????????????????????
? Name             ? Status ? Version ?
???????????????????????????????????????
? ai-proxy-simple  ? active ? 1       ?
???????????????????????????????????????
```

---

### **Test 2: Call Function Directly**

```bash
curl -X POST https://lvvvjywrmpcqrpvuptdi.supabase.co/functions/v1/ai-proxy-simple \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -d '{
    "payload": {
      "prompt": "Hello, test message",
      "context": "test"
    }
  }'
```

**Expected response:**
```json
{
  "content": "Hello! How can I help you today?",
  "usage": {
    "input_tokens": 50,
    "output_tokens": 20
  },
  "model": "claude-3-5-sonnet-20241022"
}
```

---

### **Test 3: From Browser**

```javascript
// Open browser console (F12) on your app
const supabase = window.supabase || createClient();

const { data, error } = await supabase.functions.invoke('ai-proxy-simple', {
  body: {
    payload: {
      prompt: 'Hello from browser test',
      context: 'test'
    }
  }
});

console.log('Test result:', { data, error });
```

**Expected:**
```javascript
{
  data: {
    content: "Hello! ...",
    usage: { ... },
    model: "claude-3-5-sonnet-20241022"
  },
  error: null
}
```

---

## ?? Troubleshooting

### **Error: "supabase: command not found"**

Install Supabase CLI:
```bash
npm install -g supabase
```

Then login:
```bash
supabase login
```

---

### **Error: "Not linked to a project"**

Link to your project:
```bash
supabase link --project-ref lvvvjywrmpcqrpvuptdi
```

---

### **Error: "ANTHROPIC_API_KEY not configured"**

1. Go to Supabase Dashboard
2. Settings ? Edge Functions ? Environment Variables
3. Add `ANTHROPIC_API_KEY`
4. Redeploy function

---

### **Error: 403 Forbidden**

Your Anthropic API key is invalid:
1. Go to https://console.anthropic.com/settings/keys
2. Create new key
3. Update in Supabase environment variables
4. Redeploy function

---

## ?? Function Code Location

The function code is at:
```
/workspace/supabase/functions/ai-proxy-simple/index.ts
```

**Contents:** 100 lines of TypeScript
**Dependencies:** None (uses Deno standard library)
**Database:** Not required
**Size:** ~5KB

---

## ? Success Checklist

After deployment, verify:

- [ ] Function shows in `supabase functions list`
- [ ] Function status is "active" in dashboard
- [ ] Environment variable `ANTHROPIC_API_KEY` is set
- [ ] Test curl returns 200 status with AI response
- [ ] Browser console test returns data (no error)
- [ ] Dash AI widget shows AI responses (not error messages)

---

## ?? Next Steps After Deployment

1. **Refresh your web app**
2. **Go to dashboard**
3. **Send message to Dash AI**
4. **Should get AI response!** ?

---

## ?? Still Having Issues?

### **Check Function Logs:**

```bash
supabase functions logs ai-proxy-simple --follow
```

Or in Dashboard:
- Edge Functions ? ai-proxy-simple ? Logs

### **Common Issues:**

1. **No logs appear**
   - Function not being called
   - Check function name in frontend matches

2. **"ANTHROPIC_API_KEY not set"**
   - Environment variable missing
   - Add it and redeploy

3. **"Invalid API key"**
   - Wrong API key
   - Get new one from Anthropic

4. **"Quota exceeded"**
   - Anthropic usage limit reached
   - Check your Anthropic dashboard

---

## ?? Quick Deploy Command

```bash
cd supabase/functions && supabase functions deploy ai-proxy-simple
```

That's it! Once deployed, **refresh your app and try Dash AI again!** ??
