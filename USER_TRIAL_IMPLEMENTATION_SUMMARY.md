# User-Specific Trial Subscription Implementation

## Overview
This implementation adds per-user trial subscriptions for parents, allowing them to receive their own 7-day trial independent of their school's subscription status.

## Problem Solved
Previously, `get_my_trial_status()` only looked up the school's subscription. If the school never got a trial record, new parents would see "free" status and the front-end would enforce daily limits even for brand-new parents.

## Implementation Details

### 1. Database Schema
The `subscriptions` table already had the necessary columns:
- `owner_type`: enum ('school', 'user') - identifies subscription owner type
- `user_id`: uuid (nullable) - references auth.users(id) for user subscriptions
- `school_id`: uuid (nullable) - references preschools(id) for school subscriptions

### 2. Migration: `20251031000000_implement_user_trial_subscriptions.sql`

#### Key Features:
- **Constraint added**: Ensures either `school_id` OR `user_id` is set (but not both)
- **`start_parent_trial()` RPC function**: Creates user-level trial subscriptions
  - Idempotent: Safe to call multiple times
  - Only works for users with `role = 'parent'`
  - Creates 7-day trial with status = 'trialing'
  - Returns existing subscription if already created
  
- **Updated `get_my_trial_status()` RPC function**:
  - **Priority 1**: Checks for user-level subscriptions first
  - **Priority 2**: Falls back to school-level subscriptions
  - **Priority 3**: Returns 'free' status if no subscription found
  - Returns comprehensive status including:
    - `is_trial`: boolean
    - `status`: subscription status
    - `trial_end_date`: when trial expires
    - `days_remaining`: days left in trial
    - `plan_tier`: subscription tier
    - `subscription_type`: 'user' or 'school'

### 3. Frontend Integration

#### Parent Dashboard (`web/src/app/dashboard/parent/page.tsx`)
Added `useEffect` hook that:
- Automatically calls `start_parent_trial()` when parent loads dashboard
- Only executes for users with `role = 'parent'`
- Idempotent - safe to run on every dashboard load
- Silently handles errors

```typescript
useEffect(() => {
  const startTrialIfNeeded = async () => {
    if (!userId || !profile) return;
    if (profile.role !== 'parent') return;
    
    const { data, error } = await supabase.rpc('start_parent_trial');
    // Trial starts automatically on first visit
  };
  startTrialIfNeeded();
}, [userId, profile, supabase]);
```

#### TierBadge Component (`web/src/components/ui/TierBadge.tsx`)
Updated to:
- Call `get_my_trial_status()` RPC first for accurate user/school subscription info
- Falls back to direct school lookup for backward compatibility
- Shows correct tier based on user's actual subscription (user-level or school-level)

### 4. User Flow

1. **Parent signs up** via `/sign-up/parent`
2. **Email verification** (if enabled)
3. **First dashboard visit** triggers `start_parent_trial()`
4. **Trial subscription created**:
   - `owner_type = 'user'`
   - `user_id = auth.uid()`
   - `status = 'trialing'`
   - `trial_end_date = NOW() + 7 days`
5. **TierBadge displays "Starter"** (or trial plan tier)
6. **Daily limits removed** - parent gets full trial features
7. **After 7 days**: Trial expires, status changes (handled by existing `handle_expired_trials()`)

### 5. Backward Compatibility

- Existing school subscriptions continue to work
- Teachers and principals still use school-level subscriptions
- Parents without user subscriptions fall back to school subscription
- No breaking changes to existing code

### 6. Security

- RPC functions use `SECURITY DEFINER` with proper auth checks
- `start_parent_trial()` validates user is a parent
- RLS policies on subscriptions table restrict access appropriately
- User can only create subscriptions for themselves (`auth.uid()`)

## Testing

To test the implementation:

1. **New Parent Signup**:
   ```bash
   # Sign up as parent
   # Navigate to dashboard
   # Check browser console for "Parent trial started successfully"
   ```

2. **Verify Subscription Created**:
   ```sql
   SELECT * FROM subscriptions 
   WHERE owner_type = 'user' 
   AND user_id = '<parent_user_id>';
   ```

3. **Check Trial Status**:
   ```sql
   SELECT * FROM get_my_trial_status();
   -- Should return subscription_type = 'user' for parents with trials
   ```

4. **TierBadge Display**:
   - Should show "Starter" (or trial plan) badge
   - Should not show "Free" for new parents in trial

## Optional: Backfill Existing Parents

To give existing parents a trial subscription:

```sql
-- Run this as a one-off script to backfill existing parents
INSERT INTO subscriptions (
  owner_type,
  user_id,
  plan_id,
  status,
  start_date,
  trial_end_date,
  next_billing_date,
  seats_total,
  seats_used,
  billing_frequency
)
SELECT 
  'user',
  p.id,
  (SELECT id FROM subscription_plans WHERE tier = 'starter' LIMIT 1),
  'trialing',
  NOW(),
  NOW() + INTERVAL '7 days',
  NOW() + INTERVAL '8 days',
  1,
  1,
  'monthly'
FROM profiles p
WHERE p.role = 'parent'
AND NOT EXISTS (
  SELECT 1 FROM subscriptions s 
  WHERE s.owner_type = 'user' 
  AND s.user_id = p.id
)
-- Optional: only backfill parents who haven't been active long
-- AND p.created_at > NOW() - INTERVAL '30 days'
;
```

## Files Changed

1. `/workspace/supabase/migrations/20251031000000_implement_user_trial_subscriptions.sql` (new)
2. `/workspace/web/src/app/dashboard/parent/page.tsx` (modified)
3. `/workspace/web/src/components/ui/TierBadge.tsx` (modified)

## Next Steps

1. **Apply migration**: Run the migration on your database
2. **Deploy frontend changes**: Push updated code to production
3. **Monitor**: Check that new parents are getting trials
4. **Optional**: Run backfill script for existing parents
5. **Email notifications**: Consider adding email when trial starts/expires

## Troubleshooting

- **Trial not starting**: Check browser console for errors
- **Still seeing "Free" tier**: Clear browser cache, check `get_my_trial_status()` response
- **Database errors**: Verify migration ran successfully
- **User not parent**: Only users with `role = 'parent'` get user-level trials
