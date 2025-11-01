-- Check if starter plan exists (required for trials)
SELECT id, tier, name, is_active 
FROM subscription_plans 
WHERE tier = 'starter';

-- If no rows returned, you need to create the starter plan:
-- INSERT INTO subscription_plans (tier, name, is_active, ...) VALUES ('starter', 'Starter Plan', true, ...);

-- Also check if free plan exists (fallback)
SELECT id, tier, name, is_active 
FROM subscription_plans 
WHERE tier = 'free';
