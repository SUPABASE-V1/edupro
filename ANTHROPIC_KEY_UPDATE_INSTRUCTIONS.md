# Anthropic API Key Update Required

## Problem

The current `ANTHROPIC_API_KEY` in Supabase secrets doesn't have access to any Claude models.

Error: `"type":"not_found_error","message":"model: claude-3-sonnet-20240229"`

## Solution

### Step 1: Get a New API Key

1. Go to [Anthropic Console](https://console.anthropic.com/settings/keys)
2. Log in or create an account
3. Click **"Create Key"**
4. Copy the new key (starts with `sk-ant-api03-...`)

### Step 2: Update Supabase Secret

```bash
# Set the new API key
supabase secrets set ANTHROPIC_API_KEY=sk-ant-api03-YOUR_NEW_KEY_HERE

# Verify it's set
supabase secrets list | grep ANTHROPIC
```

### Step 3: Redeploy the Edge Function

```bash
supabase functions deploy ai-proxy-simple
```

### Step 4: Test It

```bash
curl -X POST 'https://lvvvjywrmpcqrpvuptdi.supabase.co/functions/v1/ai-proxy-simple' \
  -H 'Content-Type: application/json' \
  -H 'apikey: YOUR_SUPABASE_ANON_KEY' \
  -H 'Authorization: Bearer YOUR_SUPABASE_ANON_KEY' \
  -d '{"payload": {"prompt": "Say hello"}}'
```

## Valid Claude Models (as of 2025)

The following models should work with a valid API key:

- `claude-3-5-sonnet-20241022` (recommended - latest stable)
- `claude-3-opus-20240229` (most capable)
- `claude-3-sonnet-20240229` (balanced)
- `claude-3-haiku-20240307` (fastest/cheapest)

## Current Status

- ✅ Edge function is deployed and working
- ✅ Supabase secrets are configured
- ❌ Anthropic API key needs to be updated
- ⏳ Waiting for valid API key to test

## Next Steps

1. Update the API key following steps above
2. Test the function
3. The parent dashboard AI widget should work! 🎉
