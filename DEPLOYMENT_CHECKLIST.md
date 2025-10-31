# Deployment Checklist: User-Specific Trial Implementation

## ✅ Pre-Deployment Checklist

### 1. Code Changes Complete
- [x] Database migration created
- [x] Parent signup page updated
- [x] Parent dashboard updated
- [x] TierBadge component updated
- [x] Documentation written

### 2. Files to Deploy

#### Backend (Database)
```bash
/workspace/supabase/migrations/20251031000000_implement_user_trial_subscriptions.sql
```

#### Frontend (Web)
```bash
/workspace/web/src/app/sign-up/parent/page.tsx
/workspace/web/src/app/dashboard/parent/page.tsx
/workspace/web/src/components/ui/TierBadge.tsx
```

#### Documentation
```bash
/workspace/USER_TRIAL_IMPLEMENTATION_SUMMARY.md
/workspace/FIXES_FOR_INDEPENDENT_PARENTS.md
/workspace/IMPLEMENTATION_SUMMARY.md
/workspace/DEPLOYMENT_CHECKLIST.md (this file)
```

## 🚀 Deployment Steps

### Step 1: Deploy Database Migration
```bash
# Connect to your Supabase project
# Option A: Via Supabase CLI
supabase db push

# Option B: Via Supabase Dashboard
# 1. Go to SQL Editor in Supabase Dashboard
# 2. Copy contents of 20251031000000_implement_user_trial_subscriptions.sql
# 3. Run the migration
# 4. Verify no errors

# Option C: Direct psql
psql $DATABASE_URL < supabase/migrations/20251031000000_implement_user_trial_subscriptions.sql
```

### Step 2: Verify Database Changes
```sql
-- 1. Check if functions exist
SELECT proname FROM pg_proc 
WHERE proname IN ('start_parent_trial', 'get_my_trial_status');
-- Expected: 2 rows

-- 2. Check subscriptions table structure
\d subscriptions
-- Should see: owner_type, user_id, school_id columns

-- 3. Check constraint exists
SELECT conname FROM pg_constraint 
WHERE conname = 'subscriptions_owner_check';
-- Expected: 1 row

-- 4. Test start_parent_trial function (as authenticated user)
SELECT start_parent_trial();
-- Should return JSON with success=true or already_exists=true

-- 5. Test get_my_trial_status function (as authenticated user)
SELECT get_my_trial_status();
-- Should return JSON with status, plan_tier, etc.
```

### Step 3: Deploy Frontend Changes
```bash
# Build frontend
cd web
npm run build

# Deploy to your hosting (Vercel, Netlify, etc.)
vercel deploy --prod
# OR
netlify deploy --prod
# OR your preferred deployment method
```

### Step 4: Post-Deployment Verification

#### A. Test Parent Signup (No School)
```
1. Go to /sign-up/parent
2. Fill in required fields
3. SKIP organization selection
4. Submit form
5. ✅ No validation errors
6. ✅ Account created successfully
7. Verify email (if enabled)
8. Login
9. ✅ Redirected to dashboard
10. ✅ See "Independent Parent" badge
11. ✅ See "Welcome to Your 7-Day Free Trial!" message
12. Open browser console
13. ✅ See "🎉 Parent trial started successfully"
14. Check TierBadge
15. ✅ Shows "Starter" (not "Free")
```

#### B. Test Parent Signup (With School)
```
1. Go to /sign-up/parent
2. Fill in required fields
3. SELECT an organization (that has free tier)
4. Submit form
5. ✅ Account created successfully
6. Login and go to dashboard
7. ✅ See school name badge
8. Open browser console
9. ✅ See "🎉 Parent trial started successfully"
10. Check TierBadge
11. ✅ Shows "Starter" (not school's "Free")
```

#### C. Database Verification
```sql
-- Check that new parent got trial subscription
SELECT 
  s.id,
  s.owner_type,
  s.status,
  s.trial_end_date,
  sp.tier as plan_tier,
  p.email,
  p.first_name
FROM subscriptions s
JOIN subscription_plans sp ON s.plan_id = sp.id
JOIN profiles p ON s.user_id = p.id
WHERE s.owner_type = 'user'
AND s.created_at > NOW() - INTERVAL '1 hour'
ORDER BY s.created_at DESC;

-- Expected: See new parent's trial subscription
-- owner_type = 'user'
-- status = 'trialing'
-- trial_end_date ~7 days from now
```

#### D. Test Multiple Dashboard Visits
```
1. Login as parent with trial
2. Go to dashboard
3. Open console
4. ✅ See "✓ Parent trial already active" (not "started successfully")
5. Check database
6. ✅ Still only ONE subscription for this user (no duplicates)
```

## 🔍 Monitoring & Alerts

### Metrics to Watch
```
1. Parent Signups
   - Track signups with vs without school
   - Measure completion rate
   
2. Trial Activation Rate
   - % of parents who get trials activated
   - Should be ~100% for new signups
   
3. Error Rates
   - Watch for errors in start_parent_trial()
   - Watch for errors in get_my_trial_status()
   
4. Trial Usage
   - Track AI requests during trial period
   - Measure feature adoption
```

### Database Queries for Monitoring
```sql
-- Count active user trials
SELECT COUNT(*) as active_trials
FROM subscriptions
WHERE owner_type = 'user'
AND status = 'trialing'
AND trial_end_date > NOW();

-- List parents who didn't get trials
SELECT p.id, p.email, p.created_at
FROM profiles p
WHERE p.role = 'parent'
AND p.created_at > NOW() - INTERVAL '7 days'
AND NOT EXISTS (
  SELECT 1 FROM subscriptions s
  WHERE s.owner_type = 'user'
  AND s.user_id = p.id
);

-- Count independent parents (no school)
SELECT COUNT(*) as independent_parents
FROM profiles
WHERE role = 'parent'
AND preschool_id IS NULL
AND created_at > NOW() - INTERVAL '7 days';
```

## ⚠️ Rollback Plan

If critical issues arise:

### Immediate Rollback (Frontend Only)
```bash
# Revert to previous deployment
vercel rollback
# OR
git revert <commit-hash>
git push
```

### Partial Rollback (Keep Database, Revert UI)
```bash
# Revert frontend changes only
git revert <commit-hash-for-signup-page>
git revert <commit-hash-for-dashboard>
git push

# Database functions remain (they're additive, no breaking changes)
```

### Full Rollback (Nuclear Option)
```sql
-- Only if absolutely necessary
-- 1. Drop new RPC functions (optional - they don't hurt)
DROP FUNCTION IF EXISTS start_parent_trial();
DROP FUNCTION IF EXISTS get_my_trial_status();

-- Note: DO NOT delete user subscriptions that were created
-- They represent real trials parents signed up for
```

## 🐛 Troubleshooting

### Issue: Trial Not Starting
**Symptoms**: Console shows error when calling `start_parent_trial()`

**Debug**:
```sql
-- Check if function exists
SELECT proname FROM pg_proc WHERE proname = 'start_parent_trial';

-- Check if user is authenticated
SELECT auth.uid();  -- Should return UUID, not NULL

-- Check user's role
SELECT role FROM profiles WHERE id = auth.uid();

-- Check subscription_plans table has starter plan
SELECT id, tier FROM subscription_plans WHERE tier = 'starter';
```

**Fix**:
- If function missing: Re-run migration
- If not authenticated: Check auth session
- If role wrong: Update profile role to 'parent'
- If no starter plan: Create one in subscription_plans table

### Issue: Still Showing "Free" Tier
**Symptoms**: TierBadge shows "Free" even with active trial

**Debug**:
```sql
-- Check user's subscription
SELECT * FROM get_my_trial_status();

-- Check subscriptions table directly
SELECT * FROM subscriptions 
WHERE owner_type = 'user' 
AND user_id = auth.uid();
```

**Fix**:
- Clear browser cache
- Check console for RPC errors
- Verify subscription status = 'trialing'
- Check trial_end_date is in future

### Issue: "Organization Required" Error
**Symptoms**: Can't submit signup form without selecting organization

**Debug**:
- Check if frontend changes deployed
- Check browser cache
- View page source to verify latest code

**Fix**:
- Clear browser cache
- Hard refresh (Ctrl+Shift+R)
- Re-deploy frontend

## ✅ Success Criteria

Deployment is successful when:

- [x] New parents can sign up without selecting organization
- [x] Trial auto-activates on first dashboard visit
- [x] TierBadge shows "Starter" for parents with trials
- [x] Parents in free-tier schools get their own trials
- [x] No duplicate subscriptions created
- [x] No errors in browser console
- [x] No errors in database logs
- [x] Independent parents see welcoming UI (not warnings)

## 📊 Post-Deployment Report Template

After deployment, fill this out:

```
### Deployment Report: User-Specific Trials
**Date**: [YYYY-MM-DD]
**Deployed By**: [Name]
**Environment**: Production

#### Deployment Results
- Database Migration: ✅/❌
- Frontend Deployment: ✅/❌
- Post-Deployment Tests: ✅/❌

#### Test Results
- Parent signup (no school): ✅/❌
- Parent signup (with school): ✅/❌
- Trial activation: ✅/❌
- TierBadge display: ✅/❌
- Multiple visits (idempotent): ✅/❌

#### Metrics (First 24 Hours)
- New parent signups: [number]
- Independent parents (no school): [number]
- Trials activated: [number]
- Activation rate: [percentage]
- Errors: [number]

#### Issues Encountered
- [List any issues]

#### Actions Taken
- [List actions]

#### Status
- [ ] All systems operational
- [ ] Minor issues, monitoring
- [ ] Major issues, investigating
- [ ] Rolled back
```

## 🎯 Next Steps After Deployment

1. **Monitor for 24 hours**: Watch error rates and activation rates
2. **Gather feedback**: Ask test users about signup experience
3. **Optimize**: Based on metrics, improve trial activation flow
4. **Market**: Promote the simplified signup flow
5. **Document**: Update user-facing documentation
6. **Support**: Train support team on new flow

---

**Prepared By**: AI Assistant  
**Date**: 2025-10-31  
**Version**: 1.0  
**Status**: Ready for Deployment ✅
