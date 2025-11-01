# 🚀 Apply Audit Fixes - Complete Guide

## 📋 Quick Start

### Step 1: Run Trial Migrations

```bash
# Option 1: Use the helper script
cd /workspace
./migrations/APPLY_TRIAL_FIXES.sh

# Option 2: Run manually via Supabase Dashboard
# Copy contents of these files to SQL Editor:
# 1. migrations/pending/05_trigger_trials_for_existing_users.sql
# 2. migrations/pending/06_standardize_trial_period.sql
```

### Step 2: Verify Trial Activation

```sql
-- Check how many users now have trials
SELECT 
  status,
  COUNT(*) as count,
  MIN(trial_end_date) as earliest_end,
  MAX(trial_end_date) as latest_end
FROM preschool_subscriptions
WHERE status = 'trial'
GROUP BY status;

-- Check trial configuration
SELECT * FROM system_config WHERE key = 'trial_settings';
```

### Step 3: Test Trial Features

1. **Login as existing user**
2. **Check subscription status**:
   - Should see "Trial" badge
   - Should see days remaining
   - Should have access to starter features

3. **Verify trial countdown**:
   ```sql
   SELECT get_trial_days_remaining('YOUR_PRESCHOOL_ID'::uuid);
   ```

---

## 🎯 What Gets Fixed

### 1. ✅ All Existing Users Get 7-Day Trial

**What Happens**:
- Every registered school without active subscription gets trial
- Trial starts immediately
- 7 days of full starter plan access
- Auto-converts to free after trial (no charge)

**Database Changes**:
```sql
-- Before
status: 'free'
trial_start_date: NULL
trial_end_date: NULL

-- After
status: 'trial'
trial_start_date: NOW()
trial_end_date: NOW() + 7 days
```

### 2. ✅ Trial Duration Standardized

**Single Source of Truth**:
```typescript
// Frontend: constants/trialConfig.ts
export const TRIAL_CONFIG = {
  DURATION_DAYS: 7,
  TRIAL_DISPLAY: '7-day free trial',
};

// Backend: system_config table
{
  "duration_days": 7,
  "grace_period_days": 1,
  "auto_convert_to": "free"
}
```

**Helper Functions Created**:
- `get_trial_duration_days()` - Returns configured duration
- `is_trial_active(preschool_id)` - Check if trial active
- `get_trial_days_remaining(preschool_id)` - Days left
- `create_trial_subscription(preschool_id)` - Start trial
- `create_user_trial_subscription(user_id)` - Parent trials

### 3. ✅ Parent Trial Support Added

**New Columns**:
```sql
ALTER TABLE user_subscriptions 
ADD COLUMN trial_start_date TIMESTAMPTZ,
ADD COLUMN trial_end_date TIMESTAMPTZ;
```

**New Function**:
```sql
-- Start trial for independent parents
SELECT create_user_trial_subscription('USER_ID'::uuid);
```

---

## 📊 Verification Queries

### Check Trial Stats

```sql
-- Total users on trial
SELECT COUNT(*) FROM preschool_subscriptions WHERE status = 'trial';

-- Trial expiration dates
SELECT 
  DATE(trial_end_date) as expiry_date,
  COUNT(*) as users_expiring
FROM preschool_subscriptions
WHERE status = 'trial'
GROUP BY DATE(trial_end_date)
ORDER BY expiry_date;

-- Users with < 2 days remaining
SELECT 
  p.name,
  ps.trial_end_date,
  get_trial_days_remaining(ps.preschool_id) as days_left
FROM preschool_subscriptions ps
JOIN preschools p ON p.id = ps.preschool_id
WHERE ps.status = 'trial'
AND ps.trial_end_date < NOW() + INTERVAL '2 days'
ORDER BY ps.trial_end_date;
```

### Test Helper Functions

```sql
-- Get configured trial duration
SELECT get_trial_duration_days(); -- Should return: 7

-- Check if trial is active
SELECT is_trial_active('YOUR_PRESCHOOL_ID'::uuid); -- true/false

-- Get days remaining
SELECT get_trial_days_remaining('YOUR_PRESCHOOL_ID'::uuid); -- 0-7
```

---

## 🔄 Configuration Changes

### To Change Trial Duration:

```sql
-- Update trial duration to 14 days
UPDATE system_config 
SET value = jsonb_set(value, '{duration_days}', '14')
WHERE key = 'trial_settings';

-- Verify
SELECT value->>'duration_days' FROM system_config WHERE key = 'trial_settings';
```

### To Change Grace Period:

```sql
-- Update grace period to 2 days
UPDATE system_config 
SET value = jsonb_set(value, '{grace_period_days}', '2')
WHERE key = 'trial_settings';
```

---

## 🚨 Troubleshooting

### Issue: "Starter plan not found"

```sql
-- Check if starter plan exists
SELECT * FROM subscription_plans WHERE tier = 'starter';

-- If missing, create it
INSERT INTO subscription_plans (name, tier, price_monthly)
VALUES ('Starter Plan', 'starter', 499.00);
```

### Issue: Trials not showing up

```sql
-- Manually trigger trial for specific school
SELECT create_trial_subscription('PRESCHOOL_ID'::uuid);

-- Check for errors
SELECT * FROM preschool_subscriptions WHERE preschool_id = 'PRESCHOOL_ID'::uuid;
```

### Issue: Function not found

```bash
# Re-run the standardization migration
psql -h YOUR_HOST -U YOUR_USER -d YOUR_DB -f migrations/pending/06_standardize_trial_period.sql
```

---

## 📱 Frontend Integration

### Using Trial Config

```typescript
import { TRIAL_CONFIG, getTrialDaysRemaining } from '@/constants/trialConfig';

// Display trial duration
<p>Start your {TRIAL_CONFIG.TRIAL_DISPLAY}!</p>

// Calculate days remaining
const daysLeft = getTrialDaysRemaining(new Date(trialEndDate));
<span>{daysLeft} days left in trial</span>

// Check if trial active
if (isTrialActive(new Date(trialEndDate))) {
  // Show trial features
}
```

### Example: Trial Badge Component

```typescript
import { TRIAL_CONFIG, getTrialDaysRemaining, isTrialActive } from '@/constants/trialConfig';

export function TrialBadge({ trialEndDate }: { trialEndDate: Date }) {
  const daysLeft = getTrialDaysRemaining(trialEndDate);
  const isActive = isTrialActive(trialEndDate);
  
  if (!isActive) return null;
  
  return (
    <div className="trial-badge">
      <span>🎁 Trial</span>
      <span>{daysLeft} days left</span>
    </div>
  );
}
```

---

## 🎯 Next Steps After Migration

### 1. **Test Trial Flow**
- [ ] New user signup → gets trial
- [ ] Existing user → sees trial active
- [ ] Trial countdown → updates daily
- [ ] Trial expiry → converts to free

### 2. **Add UI Indicators**
- [ ] Trial badge in dashboard
- [ ] Days remaining counter
- [ ] "Upgrade before trial ends" CTA
- [ ] Trial expired message

### 3. **Implement Notifications**
- [ ] Email on trial start
- [ ] Email 2 days before expiry
- [ ] Email on trial end
- [ ] In-app notifications

### 4. **Monitor Metrics**
- [ ] Trial activation rate
- [ ] Trial → paid conversion rate
- [ ] Features used during trial
- [ ] Upgrade timing

---

## 📈 Success Metrics

After applying fixes, track:

| Metric | Target | How to Measure |
|--------|--------|----------------|
| Users on trial | 100% of new signups | `COUNT(*) WHERE status='trial'` |
| Trial completion rate | >80% | Users who use trial for 7 days |
| Trial → paid conversion | >30% | Users who upgrade after trial |
| Feature engagement | >50% | AI queries during trial |

---

## 🎉 You're Done!

All existing users now have:
- ✅ 7-day free trial
- ✅ Full starter plan access
- ✅ Automatic trial tracking
- ✅ Consistent messaging

**Next**: Choose which audit fix to implement next! 🚀

Options:
1. Parent trial subscriptions
2. Guest mode UI improvements
3. Trial notification system
4. Teacher results dashboard
