# CORS Fix - Required Steps

## Issue
Edge Function CORS preflight (OPTIONS) requests are being blocked even though the code has proper CORS headers.

## Root Cause
Supabase Edge Functions have **TWO levels of security**:
1. **Platform-level** JWT verification (happens BEFORE your code runs)
2. **Code-level** authentication (in your function code)

The `--no-verify-jwt` flag we used only affects deployment, but doesn't disable platform JWT checking for OPTIONS requests.

## Solution

### Option 1: Disable JWT Verification in Supabase Dashboard (RECOMMENDED)

1. Go to: https://supabase.com/dashboard/project/lvvvjywrmpcqrpvuptdi/functions
2. Click on `ai-proxy` function
3. Go to **Settings** tab
4. Find "**Verify JWT**" toggle
5. **Turn it OFF**
6. Save changes

This will allow OPTIONS requests (CORS preflight) to pass through without authentication.

### Option 2: Use Supabase CLI to Update Function Config

```bash
cd /home/king/Desktop/edudashpro

# Create function config file
cat > supabase/functions/ai-proxy/.funcignore << 'EOF'
# Empty - no files to ignore
EOF

# Update with verify-jwt = false
npx supabase functions deploy ai-proxy \
  --no-verify-jwt \
  --project-ref lvvvjywrmpcqrpvuptdi
```

### Option 3: Use Anonymous Key Instead of Auth Token

In `AskAIWidget.tsx`, change the function call to use the anon key:

```typescript
const { data, error } = await supabase.functions.invoke('ai-proxy', {
  body: {
    // ... existing body
  },
  headers: {
    // Use anon key instead of user token
    'apikey': supabaseAnonKey,
    'Authorization': `Bearer ${supabaseAnonKey}`
  }
});
```

But you'll need to handle auth inside the Edge Function differently.

### Option 4: Add Public Endpoint (TEMPORARY WORKAROUND)

Create a separate public endpoint that doesn't require auth:

```typescript
// In ai-proxy/index.ts, before the auth check:

// Allow public access for OPTIONS
if (req.method === 'OPTIONS') {
  return new Response('ok', { 
    status: 200,
    headers: corsHeaders 
  });
}

// Allow public access for specific paths
const url = new URL(req.url);
if (url.pathname.endsWith('/public')) {
  // Handle public requests without auth
  // ... your logic
}
```

---

## Recommended Action

**Go to the Supabase Dashboard NOW and disable JWT verification for the ai-proxy function.**

This is the quickest fix and won't require code changes.

After disabling:
1. Hard refresh your browser (Ctrl+Shift+R)
2. Try generating an exam again
3. CORS error should be gone!

---

## Verification

After making the change, test with curl:

```bash
# Test OPTIONS request (should return 200)
curl -X OPTIONS \
  -H "Origin: http://192.168.0.31:3000" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: authorization,content-type" \
  -v \
  https://lvvvjywrmpcqrpvuptdi.supabase.co/functions/v1/ai-proxy

# Look for:
# < HTTP/2 200
# < access-control-allow-origin: *
```

If you see `HTTP/2 200` and the CORS headers, it's working!

---

## Why This Happens

Supabase Edge Functions default to **requiring JWT authentication** for security. This is good for API endpoints, but it breaks CORS because:

1. Browser sends OPTIONS request (preflight) **without auth headers**
2. Supabase checks for JWT **before** running your function code
3. No JWT → Supabase returns 401/403 **before** your CORS handler runs
4. Browser sees non-200 response → blocks the actual POST request

The fix is to tell Supabase "this function doesn't need JWT verification" so OPTIONS requests can reach your CORS handler.
