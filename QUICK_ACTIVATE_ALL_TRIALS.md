# ? Quick Activate Trials for All Parents

**Run this in Supabase SQL Editor**

---

## ?? One-Click Activation

### **Activate 7-Day Trials for All Independent Parents:**

```sql
UPDATE profiles
SET 
  is_trial = TRUE,
  trial_end_date = NOW() + INTERVAL '7 days',
  trial_plan_tier = 'premium',
  trial_started_at = NOW(),
  updated_at = NOW()
WHERE 
  role = 'parent'
  AND preschool_id IS NULL
  AND (is_trial = FALSE OR is_trial IS NULL);
```

---

## ? Verify It Worked

```sql
-- Count how many trials were activated
SELECT COUNT(*) as trials_activated
FROM profiles
WHERE 
  role = 'parent'
  AND preschool_id IS NULL
  AND is_trial = TRUE;
```

---

## ?? See All Users with Trials

```sql
SELECT 
  u.email,
  p.usage_type,
  p.trial_end_date,
  EXTRACT(DAY FROM p.trial_end_date - NOW()) as days_remaining
FROM profiles p
JOIN auth.users u ON u.id = p.id
WHERE 
  p.role = 'parent'
  AND p.is_trial = TRUE
ORDER BY p.trial_started_at DESC;
```

---

## ?? Who Gets Trials

? **Independent parents** (preschool_id = NULL)  
? **Homeschool parents**  
? **Supplemental users**  
? **Exploring users**  

? **Organization-linked parents** (they get org-level trials instead)

---

## ?? Expected Impact

If you have 50 independent parents:
- 50 users will see trial banner
- 50 users get 7 days of Premium features
- Higher engagement & conversion potential

---

**Run the UPDATE query above and all independent parents will have trials!** ??
