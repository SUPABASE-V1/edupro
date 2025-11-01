# ?? DEPLOY AI FUNCTION - Exact Steps

The code is fixed locally, but you need to deploy it to Supabase.

---

## ? Method 1: Supabase CLI (Easiest)

Open a terminal and run these **exact commands**:

```bash
# 1. Navigate to your workspace
cd /workspace

# 2. Go to functions directory
cd supabase/functions

# 3. Deploy the function
supabase functions deploy ai-proxy-simple
```

**That's it!** After deployment, refresh your browser and try again.

---

## ? Method 2: Supabase Dashboard (Manual)

### **Step 1: Copy the Fixed Code**

```bash
# Open this file:
/workspace/supabase/functions/ai-proxy-simple/index.ts

# Copy ALL the contents (Ctrl+A, Ctrl+C)
```

### **Step 2: Update in Dashboard**

1. **Go to:** https://supabase.com/dashboard/project/lvvvjywrmpcqrpvuptdi/functions

2. **Click** on `ai-proxy-simple` function

3. **Click** the "Code" or "Editor" tab

4. **Delete all existing code** (Ctrl+A, Delete)

5. **Paste** the new code from the file (Ctrl+V)

6. **Click** the **"Deploy"** button (usually top-right)

7. **Wait** for "Successfully deployed" message

### **Step 3: Verify**

Go to the "Logs" tab and you should see:
```
[ai-proxy-simple] Request received
[ai-proxy-simple] Calling Claude API...
[ai-proxy-simple] Claude API success
```

---

## ? Method 3: Replace Function Manually

If the file is confusing, here's the **exact fixed code**:

```typescript
/**
 * Simplified AI Proxy - No quota checks, minimal logging
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY')

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    console.log('[ai-proxy-simple] Request received')

    // Check API key
    if (!ANTHROPIC_API_KEY) {
      console.error('[ai-proxy-simple] ANTHROPIC_API_KEY not set!')
      return new Response(
        JSON.stringify({
          error: 'ANTHROPIC_API_KEY not configured. Please set it in Supabase Edge Function environment variables.'
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Parse request
    const body = await req.json()
    const { payload } = body
    const prompt = payload?.prompt || 'Hello'

    console.log('[ai-proxy-simple] Calling Claude API...')

    // Call Claude API
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-3-5-sonnet-20240620',
        max_tokens: 4096,
        messages: [{
          role: 'user',
          content: `You are a helpful South African educational AI assistant specializing in CAPS curriculum.

Context: ${payload?.context || 'general_question'}
Language: ${payload?.metadata?.language || 'en-ZA'}

User question: ${prompt}

Provide a clear, helpful response appropriate for the educational context.`
        }]
      })
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('[ai-proxy-simple] Claude API error:', errorText)
      throw new Error(`Claude API error: ${response.status} ${errorText}`)
    }

    const data = await response.json()
    console.log('[ai-proxy-simple] Claude API success')

    // Extract text content
    const content = data.content?.[0]?.text || 'No response from AI'

    return new Response(
      JSON.stringify({
        content,
        usage: data.usage,
        model: data.model
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('[ai-proxy-simple] Error:', error)
    return new Response(
      JSON.stringify({
        error: error.message || 'Internal server error',
        details: String(error)
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
```

**Copy this code ? Paste in Supabase Dashboard ? Click Deploy**

---

## ?? What Changed

**Line 52:**
- Before: `model: 'claude-3-5-sonnet-20241022'` ?
- After: `model: 'claude-3-5-sonnet-20240620'` ?

That's the ONLY change!

---

## ? Verify Fix is Deployed

After deploying, check logs again. You should see:
```
[ai-proxy-simple] Request received
[ai-proxy-simple] Calling Claude API...
[ai-proxy-simple] Claude API success  ? Should see this!
```

Instead of:
```
Claude API error: 404 not_found_error  ? Should NOT see this
```

---

## ?? Quick Deploy

**Run this ONE command:**
```bash
cd /workspace/supabase/functions && supabase functions deploy ai-proxy-simple
```

Then refresh your browser!

---

**The fix is ready in the file - you just need to deploy it to Supabase!** ??
