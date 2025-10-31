# Dash AI Vercel Environment Fix

## Issue
"Dash AI is not enabled in this environment" error appears in production (Vercel) but works locally.

## Root Cause
The `AskAIWidget.tsx` component checks for `NEXT_PUBLIC_AI_PROXY_ENABLED` environment variable, but this was missing from both the `.env` file and Vercel environment variables.

## Fix Applied

### Local Environment
Added to `.env` and `.env.example`:
```bash
NEXT_PUBLIC_AI_PROXY_ENABLED=true
EXPO_PUBLIC_AI_PROXY_ENABLED=true
```

### Vercel Environment Variables (ACTION REQUIRED)

You need to add these environment variables to your Vercel project:

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your EduDash Pro project
3. Go to **Settings** > **Environment Variables**
4. Add the following variables:

| Name | Value | Environment |
|------|-------|-------------|
| `NEXT_PUBLIC_AI_PROXY_ENABLED` | `true` | Production, Preview, Development |
| `EXPO_PUBLIC_AI_PROXY_ENABLED` | `true` | Production, Preview, Development |

5. Click **Save**
6. Go to **Deployments** tab
7. Find the latest deployment and click the **⋯** menu
8. Select **Redeploy** to rebuild with the new environment variables

## Verification

After redeploying, the Dash AI widget should work in production. You can verify by:

1. Opening the parent dashboard at `https://edudashpro.vercel.app/dashboard/parent`
2. Clicking on the "Ask Dash AI" widget
3. The error message should no longer appear, and you should be able to send messages

## Technical Details

The `isDashAIEnabled()` function in `web/src/components/dashboard/AskAIWidget.tsx` (lines 22-35) checks for these environment variables:
- `process.env.NEXT_PUBLIC_AI_PROXY_ENABLED`
- `process.env.EXPO_PUBLIC_AI_PROXY_ENABLED`

Without these variables set to `true`, the widget displays the error message instead of making API calls to the `ai-proxy` edge function.

## Related Documentation
- `web/EXAM_PREP_INTEGRATION_VERIFIED.md` - Documents this requirement
- `web/AI_PROXY_FIX.md` - Original AI proxy documentation
