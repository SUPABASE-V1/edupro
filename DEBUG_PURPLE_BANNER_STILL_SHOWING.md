# ?? Debug: Purple Banner Still Showing

**Issue:** Purple organization banner showing for independent user

---

## ?? CRITICAL: Which Banner Are You Seeing?

### **Banner 1: Trial Banner (Green/Orange/Red)**
```
? 7 Days Left ? Premium Trial [Upgrade]
```
- Color: Green (>7 days), Orange (3-7 days), Red (0-3 days)
- This SHOULD show for independent users ?

### **Banner 2: Purple Organization Banner**
```
?? [School Name]    [Premium Badge]
```
- Color: Purple gradient
- This should NOT show for independent users ?

**Which one are you seeing?**

---

## ?? Debugging Steps

### **Step 1: Check Browser Console**

Open DevTools (F12) ? Console tab

Look for this log:
```
?? [ParentDashboard] Profile Debug: {
  preschoolId: ???,
  preschoolName: ???,
  hasOrganization: ???,
  usageType: ???,
  shouldShowBanner: ???
}
```

**What does it say?**

---

### **Step 2: Check Database**

Run this in Supabase SQL Editor:
```sql
SELECT 
  id,
  email,
  first_name,
  preschool_id,
  usage_type,
  role,
  is_trial,
  trial_end_date
FROM profiles
WHERE email = 'the-test-user@email.com';  -- Replace with actual email
```

**Critical fields:**
- `preschool_id` ? Should be **NULL** for independent users
- `usage_type` ? Should be something like 'k12_school', 'homeschool', etc.
- `is_trial` ? Should be **TRUE**
- `trial_end_date` ? Should be ~7 days from signup

---

### **Step 3: Check Join Requests**

Check if there's a pending join request:
```sql
SELECT 
  pr.id,
  pr.parent_id,
  pr.organization_id,
  pr.status,
  pr.created_at,
  o.name as organization_name
FROM parent_join_requests pr
LEFT JOIN preschools o ON pr.organization_id = o.id
WHERE pr.parent_id = (
  SELECT id FROM profiles WHERE email = 'the-test-user@email.com'
);
```

**If this returns rows:**
- Check `status` column
- If status = 'approved' ? That's why preschool_id got set!

---

## ?? Common Causes

### **Cause 1: User Actually Selected Organization**

**What happened:**
1. User signed up
2. Saw organization selector (shows for all types now)
3. Clicked and selected a school (even accidentally)
4. Join request created
5. Admin approved it quickly
6. `preschool_id` got set
7. Purple banner shows

**Solution:**
Clear the preschool_id:
```sql
UPDATE profiles
SET preschool_id = NULL
WHERE email = 'the-test-user@email.com';
```

---

### **Cause 2: Old Cached Code**

**What happened:**
- Browser cached old JavaScript
- Still using old conditional logic

**Solution:**
1. Hard refresh: `Ctrl+Shift+R` (Windows/Linux) or `Cmd+Shift+R` (Mac)
2. Or open incognito window
3. Clear `.next` folder and restart dev server:
   ```bash
   rm -rf web/.next
   cd web && npm run dev
   ```

---

### **Cause 3: Multiple Banners in Code**

**Check if there are multiple purple banners:**

Search the codebase:
```bash
cd /workspace
grep -r "667eea.*764ba2" web/src/app/dashboard/parent/
```

Should only return **ONE** result at line ~511 in `page.tsx`

---

### **Cause 4: Invitation Code Used**

**What happened:**
- User used an invitation code during signup
- Invitation auto-linked them to organization

**Check:**
```sql
SELECT 
  p.email,
  p.preschool_id,
  i.code,
  i.preschool_id as invited_to
FROM profiles p
LEFT JOIN invitations i ON p.preschool_id = i.preschool_id
WHERE p.email = 'the-test-user@email.com';
```

---

## ?? Fresh Test (Clean Slate)

### **Test with Brand New User:**

1. **Use completely new email** (never used before)
2. **Sign up:**
   - Select "School age (6-18 years)"
   - **DO NOT CLICK** on organization selector
   - **DO NOT TYPE** anything in organization search
   - Leave it completely blank
3. **Check URL params:** Should NOT have `?invitation=...`
4. **Complete signup**
5. **Check console** for:
   ```
   [Signup] ? 7-day Premium trial started for user@email.com
   ```
6. **Verify email and login**
7. **Check dashboard**

---

## ?? What I Need

Send me screenshots of:

1. **Browser console** - The debug log:
   ```
   ?? [ParentDashboard] Profile Debug: { ... }
   ```

2. **Database query result:**
   ```sql
   SELECT preschool_id, usage_type, is_trial 
   FROM profiles 
   WHERE email = 'user@email.com';
   ```

3. **The banner you're seeing** - Screenshot of the dashboard

This will tell me EXACTLY what's wrong!

---

## ?? Expected Results (Independent User)

**Console:**
```
?? [ParentDashboard] Profile Debug: {
  preschoolId: null,              ?
  preschoolName: undefined,       ?
  hasOrganization: false,         ?
  usageType: "k12_school",        ?
  shouldShowBanner: false         ?
}
```

**Database:**
```
preschool_id: null              ?
usage_type: 'k12_school'        ?
is_trial: true                  ?
trial_end_date: 2025-11-08      ?
```

**Dashboard:**
```
? Trial banner shows (green/orange/red)
? Purple org banner DOES NOT show
? Navigation shows "AI Help"
? Navigation does NOT show "Messages"
```

---

**What do you see in the console log?** That's the smoking gun! ??
