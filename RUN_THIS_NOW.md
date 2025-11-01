# 🚀 RUN THIS NOW - Database Setup

**Everything is ready! Here's exactly what to do:**

---

## ⚡ The Commands You Need

### **1. Open Supabase SQL Editor**
Go to: **Supabase Dashboard** → **SQL Editor** → **New Query**

### **2. Copy THIS file:**
```
/workspace/migrations/20251101_add_usage_type_and_fix_currency.sql
```

### **3. Paste & Run**
Click **Run** button (bottom right) ▶️

### **4. Approve Organizations**

**Option A: Via Superadmin Dashboard** (Recommended)
1. Login as superadmin
2. Go to: `/dashboard/admin/organizations`
3. Click **Approve** on each organization

**Option B: Via SQL** (Quick for development)
```sql
UPDATE preschools 
SET approved = TRUE, verified = TRUE 
WHERE is_active = TRUE;
```

### **5. Verify**
```sql
-- Should show usage types
SELECT usage_type, COUNT(*) FROM profiles 
WHERE role = 'parent' GROUP BY usage_type;

-- Should show ZAR
SELECT DISTINCT currency FROM fees;
```

---

## ✅ Done!

Your database now supports:
- ✅ **6 parent usage types** (preschool, homeschool, etc.)
- ✅ **Optional school linking** (no forced connection)
- ✅ **ZAR currency** throughout (South African Rand 🇿🇦)
- ✅ **School approval system** (only approved schools show)

---

## 🧪 Test It

Go to: `/sign-up/parent`

Try signing up as **Homeschool** - should work WITHOUT selecting a school!

---

## 📊 What Changed

```
✅ profiles table       → +usage_type column
✅ preschools table     → +approved, +verified columns  
✅ students table       → +date_of_birth, +grade_level
✅ fees/payments        → +currency (ZAR)
✅ Helper functions     → Feature checking
```

---

## 🆘 Problems?

**No schools in signup?**
```sql
UPDATE preschools SET approved = TRUE, verified = TRUE;
```

**Still stuck?**
- Check Supabase logs for errors
- See `/workspace/migrations/MIGRATION_INSTRUCTIONS.md`
- Verify the SQL ran successfully

---

## 💰 Currency Note

All amounts are now in **ZAR (South African Rand)**:
- Display as: **R99.99** (not $99.99)
- Database stores: **ZAR**
- Pricing: R0 (Free), R99.99 (Premium), R199.99 (Family)

---

## 📁 Files Created

```
migrations/
  20251101_add_usage_type_and_fix_currency.sql  ← RUN THIS
  MIGRATION_INSTRUCTIONS.md                      ← Full details
  QUICK_START.md                                 ← Quick reference

PARENT_SIGNUP_FLOW_AUDIT.md                     ← Why we did this
FEATURE_DIFFERENTIATION_GUIDE.md                ← How features work
SPRINT_SUMMARY.md                                ← What we built
DATABASE_SETUP_COMMANDS.md                       ← Setup guide
```

---

## ⏱️ Time Required

- **Migration:** 1 minute
- **Approve schools:** 30 seconds  
- **Verify:** 30 seconds
- **Total:** 2 minutes

---

## 🎯 What This Enables

**Before:**
❌ All parents MUST link to a school  
❌ Homeschoolers blocked  
❌ Independent learners excluded  

**After:**
✅ Choose your usage type  
✅ School linking optional  
✅ Everyone welcome  
✅ ZAR currency throughout  

---

**Ready?** Open Supabase SQL Editor and run that migration file! 🚀

---

*P.S. The migration is safe - it adds columns, doesn't delete anything. But if you're nervous, run it on a development database first!*
