# ?? Debug: Purple Banner Still Showing

**Issue:** User reports purple banner showing even though they have no `preschool_id`

---

## ?? What to Check

### **1. Open Browser Console**

When you load the parent dashboard, look for this log:
```
?? [ParentDashboard] Profile Debug: {
  preschoolId: null,           // Should be null for independent parents
  preschoolName: undefined,    // Should be undefined
  hasOrganization: false,      // Should be false
  usageType: "independent",    // Should be independent/homeschool/etc
  shouldShowBanner: false      // Should be FALSE
}
```

---

## ?? Possible Causes

### **Cause 1: User Actually Has preschool_id in Database**

Even if you think the user is independent, they might have a `preschool_id` in the database.

**Check SQL:**
```sql
SELECT 
  id,
  email,
  first_name,
  preschool_id,
  usage_type,
  role
FROM profiles
WHERE email = 'user@example.com';
```

If `preschool_id` is NOT NULL, that's why the banner shows!

**Fix:** Set it to NULL:
```sql
UPDATE profiles
SET preschool_id = NULL
WHERE email = 'user@example.com';
```

---

### **Cause 2: Browser Cache**

The old dashboard code might be cached in the browser.

**Fix:**
1. Hard refresh: `Ctrl+Shift+R` (Windows/Linux) or `Cmd+Shift+R` (Mac)
2. Clear browser cache
3. Or open in incognito/private window

---

### **Cause 3: Next.js Build Cache**

The development server might have stale code.

**Fix:**
```bash
# Stop dev server
# Delete .next folder
rm -rf web/.next

# Restart dev server
cd web && npm run dev
```

---

### **Cause 4: Multiple Banners in Code**

There might be another banner elsewhere.

**Check:** The purple banner code is ONLY at line 507-540 in `page.tsx`:
```tsx
{hasOrganization && preschoolName && (
  <div style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
    {/* Purple banner */}
  </div>
)}
```

If you see the banner, this condition MUST be evaluating to `true`.

---

## ?? Debug Steps

### **Step 1: Check Console Logs**

Open browser DevTools ? Console tab, look for:
```
?? [ParentDashboard] Profile Debug: { ... }
```

This will tell you the ACTUAL values being used.

---

### **Step 2: Check Database**

Run this query with the user's email:
```sql
SELECT 
  p.id,
  p.email,
  p.first_name,
  p.last_name,
  p.preschool_id,
  p.usage_type,
  p.role,
  pr.name as preschool_name
FROM profiles p
LEFT JOIN preschools pr ON p.preschool_id = pr.id
WHERE p.email = 'user@example.com';
```

Check if:
- ? `preschool_id` is NULL (should be NULL for independent)
- ? `usage_type` is 'independent' or 'homeschool' or 'supplemental'
- ? `preschool_name` is NULL

---

### **Step 3: Hard Refresh**

1. Press `Ctrl+Shift+R` (or `Cmd+Shift+R` on Mac)
2. Or open in incognito window
3. Check if banner still shows

---

### **Step 4: Check Network Tab**

1. Open DevTools ? Network tab
2. Refresh page
3. Find the request to Supabase for profiles
4. Check the response - what does `preschool_id` say?

---

## ?? Expected Behavior

### **Independent Parent (NO preschool_id):**
```
? preschoolId: null
? preschoolName: undefined
? hasOrganization: false
? usageType: "independent"
? Purple banner: HIDDEN ?
```

### **Organization Parent (HAS preschool_id):**
```
? preschoolId: "abc-123-def"
? preschoolName: "Sunny Preschool"
? hasOrganization: true
? usageType: "preschool" or "k12_school"
? Purple banner: SHOWN ?
```

---

## ?? Most Likely Cause

**The user actually HAS a `preschool_id` in the database.**

Even if they signed up as independent, something might have set their `preschool_id`:
- Maybe they selected an organization during signup
- Maybe there was an invitation code
- Maybe a migration/script set it

**Solution:** Check the database and clear the `preschool_id` if needed.

---

## ?? What to Send Me

If the issue persists, send:

1. **Console logs** - Screenshot of the debug output
2. **Database query result** - The SELECT query result
3. **Screenshot** - The purple banner you're seeing

This will help me identify exactly what's wrong!

---

**Debug logging added to:** `web/src/app/dashboard/parent/page.tsx` (line ~95)
