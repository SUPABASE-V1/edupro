# 📚 Subscription Schema Reference

## Valid Enum Values

### subscription_status (Status Values)
```sql
CREATE TYPE subscription_status AS ENUM (
  'active',      -- Subscription is active and paid
  'past_due',    -- Payment failed, grace period
  'canceled',    -- User canceled subscription
  'unpaid',      -- Payment not received
  'trialing'     -- In trial period
);
```

**Note**: There is **NO 'free' status**. Use 'active' for free tier subscriptions.

### subscription_tier (Plan Levels)
```sql
CREATE TYPE subscription_tier AS ENUM (
  'free',        -- Free tier
  'starter',     -- Starter plan
  'premium',     -- Premium plan
  'enterprise'   -- Enterprise plan
);
```

### billing_frequency
```sql
CREATE TYPE billing_frequency AS ENUM (
  'monthly',
  'annual'
);
```

---

## Schema Structure

### subscriptions table
```sql
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY,
  school_id UUID → preschools(id),
  plan_id UUID → subscription_plans(id),
  
  -- Status is an ENUM, not 'free'!
  status subscription_status DEFAULT 'trialing',
  
  billing_frequency billing_frequency DEFAULT 'monthly',
  start_date TIMESTAMPTZ DEFAULT NOW(),
  trial_end_date TIMESTAMPTZ,
  next_billing_date TIMESTAMPTZ,
  ...
);
```

### subscription_plans table
```sql
CREATE TABLE subscription_plans (
  id UUID PRIMARY KEY,
  name TEXT NOT NULL,
  
  -- Tier is an ENUM with 'free' as an option
  tier subscription_tier NOT NULL UNIQUE,
  
  price_monthly DECIMAL(10,2) DEFAULT 0,
  max_teachers INTEGER DEFAULT 0,
  max_students INTEGER DEFAULT 0,
  ...
);
```

---

## Common Mistakes

### ❌ WRONG
```sql
-- This fails because 'free' is not a valid status
UPDATE subscriptions SET status = 'free';

-- This fails because status column is an enum
WHERE status = 'free';
```

### ✅ CORRECT
```sql
-- Check if on free tier
SELECT s.* FROM subscriptions s
JOIN subscription_plans p ON s.plan_id = p.id
WHERE p.tier = 'free';

-- Or use active status for free tier users
UPDATE subscriptions SET status = 'active'
WHERE plan_id = (SELECT id FROM subscription_plans WHERE tier = 'free');
```

---

## Subscription Lifecycle

```
NEW SIGNUP
    ↓
status: 'trialing'
tier: 'starter'
trial_end_date: NOW() + 7 days
    ↓
TRIAL ENDS (with payment)
    ↓
status: 'active'
tier: 'starter'
    ↓
TRIAL ENDS (without payment)
    ↓
status: 'active'
tier: 'free' (downgrade)
    ↓
USER UPGRADES
    ↓
status: 'active'
tier: 'premium'
    ↓
PAYMENT FAILS
    ↓
status: 'past_due'
    ↓
USER CANCELS
    ↓
status: 'canceled'
```

---

## Query Examples

### Get all trialing users
```sql
SELECT * FROM subscriptions WHERE status = 'trialing';
```

### Get all free tier users
```sql
SELECT s.* FROM subscriptions s
JOIN subscription_plans p ON s.plan_id = p.id
WHERE p.tier = 'free';
```

### Get trial days remaining
```sql
SELECT 
  school_id,
  EXTRACT(DAY FROM (trial_end_date - NOW()))::INTEGER as days_left
FROM subscriptions
WHERE status = 'trialing'
AND trial_end_date > NOW();
```

### Upgrade from free to starter
```sql
UPDATE subscriptions
SET plan_id = (SELECT id FROM subscription_plans WHERE tier = 'starter')
WHERE plan_id = (SELECT id FROM subscription_plans WHERE tier = 'free');
```

---

## Migration Checklist

When creating subscriptions:
- ✅ Set `status` to one of: 'active', 'trialing', 'past_due', 'canceled', 'unpaid'
- ✅ Set `plan_id` to reference a plan with appropriate `tier`
- ✅ Never set `status = 'free'` (use tier instead)
- ✅ For free tier: `status = 'active'` + `tier = 'free'`
- ✅ For trials: `status = 'trialing'` + any tier + `trial_end_date`

---

## ✅ Fixed Migration Approach

Instead of:
```sql
-- ❌ Wrong
WHERE status = 'free'
```

Use:
```sql
-- ✅ Correct - Find free tier subscriptions
WHERE plan_id IN (
  SELECT id FROM subscription_plans WHERE tier = 'free'
)
```

Or simpler:
```sql
-- ✅ Correct - Update non-trial active subscriptions
WHERE status = 'active' 
AND trial_end_date IS NULL
```

---

This reference should prevent future enum errors!
