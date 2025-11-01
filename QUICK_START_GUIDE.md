# ?? Quick Start Guide - Test Your Updates!

**What was done:** Fixed pricing page, added exam prep features, continued refactoring efforts

---

## ? 1. Pricing Page Fixes

### **What Changed:**
- ? Shows "Back to Dashboard" when logged in (not "Sign In")
- ? Hides "7-day free trial" banner if you're already on trial
- ? Removes "7-day free trial" from plan features if on trial

### **Test It:**
```bash
1. Visit: http://localhost:3000/pricing
2. Check header:
   - Logged in? Should see [? Back to Dashboard]
   - Not logged in? Should see [Sign In]
3. Click back button ? Returns to dashboard
```

---

## ?? 2. Exam Prep Features (NEW!)

### **What's New:**
- ? Red "EXAM WEEK MODE" banner at top
- ? ?? Emergency Exam Help button (big pink)
- ? Quick Practice grid (one-click tests)
- ? Last-Minute Exam Tips (6 essential tips)

### **Test It:**
```bash
1. Visit: http://localhost:3000/dashboard/parent
2. Should see (if you have children):
   ??????????????????????????????????
   ? ?? EXAM WEEK MODE              ?
   ? [Start Prep ?]                 ?
   ??????????????????????????????????

3. Click "Start Prep" ? AI opens with exam help
4. Click any subject ? AI generates practice test
5. Scroll down to see exam tips
```

---

## ?? 3. Purple Banner Check

### **Debug Console:**
Open browser DevTools (F12) ? Console, look for:
```
?? [ParentDashboard] Profile Data: {
  preschoolId: null,
  hasOrganization: false,
  ...
}

?? [OrganizationBanner] Render decision: {
  hasOrganization: false,
  preschoolName: undefined,
  willRender: false
}

? [OrganizationBanner] NOT rendering
```

### **What Should Happen:**
- **Independent parent:** NO purple banner
- **Organization parent:** SHOWS purple banner

### **If Purple Banner STILL Shows:**
Send me:
1. Screenshot of console logs
2. Screenshot of banner
3. Output of this SQL query:
```sql
SELECT email, preschool_id, usage_type, is_trial
FROM profiles
WHERE email = 'your@email.com';
```

---

## ?? 4. Start Development Server

```bash
cd web
npm run dev
```

Then visit: `http://localhost:3000/dashboard/parent`

---

## ?? 5. What You'll See

### **Dashboard Layout (with exam features):**

```
?? Good afternoon, Sarah!
????????????????????????????
? 7 Days Left ? Premium Trial
[Upgrade]
????????????????????????????
?? EXAM WEEK MODE
Practice tests & revision notes
[Start Prep ?]
????????????????????????????
?? My Children
[Emma, Grade 10]
????????????????????????????
? Quick Actions
My Children | AI Help | Lessons
????????????????????????????
?? EMERGENCY EXAM HELP
AI Tutor ? Instant Help ? 24/7
[Click for Help]
????????????????????????????
? Quick Practice
?? Math  ?? Science  ?? English
????????????????????????????
?? Last-Minute Exam Tips
? Start Early
?? Stay Hydrated
?? Practice Past Papers
...
```

---

## ?? 6. Test Checklist

### **Pricing Page:**
- [ ] Shows correct button (Sign In vs Back)
- [ ] Trial banner hidden if on trial
- [ ] Back button works
- [ ] Plan features correct

### **Dashboard:**
- [ ] Exam week banner shows
- [ ] Emergency help button works
- [ ] Quick practice grid shows
- [ ] Exam tips visible
- [ ] Purple banner only for org parents

### **AI Integration:**
- [ ] "Start Prep" opens AI
- [ ] Subject click opens AI
- [ ] Emergency help opens AI
- [ ] All show correct prompts

---

## ?? 7. Troubleshooting

### **Issue: Purple banner still shows**
**Solution:**
1. Clear Next.js cache: `rm -rf web/.next`
2. Restart dev server: `npm run dev`
3. Hard refresh browser: `Ctrl+Shift+R` (or `Cmd+Shift+R`)
4. Check console logs
5. Verify database: `preschool_id` should be `null`

### **Issue: Exam features not showing**
**Solution:**
1. Make sure you're logged in as a parent
2. Make sure you have at least one child added
3. Check console for errors
4. Verify you're on `/dashboard/parent`

### **Issue: AI doesn't open**
**Solution:**
1. Check console for errors
2. Verify AI widget is imported
3. Check state: `showAskAI` should toggle
4. Try clicking "AI Help" in quick actions

---

## ?? 8. Database Fix (If Needed)

**If you still have issues with trial or usage_type:**

```sql
-- Run in Supabase SQL Editor:

-- Fix trigger
CREATE OR REPLACE FUNCTION create_profile_for_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (
    id, email, first_name, last_name, role,
    usage_type,
    phone, created_at, updated_at
  ) VALUES (
    NEW.id, NEW.email,
    NEW.raw_user_meta_data->>'first_name',
    NEW.raw_user_meta_data->>'last_name',
    COALESCE(NEW.raw_user_meta_data->>'role', 'parent'),
    NEW.raw_user_meta_data->>'usage_type',
    NEW.raw_user_meta_data->>'phone',
    NOW(), NOW()
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fix your user
UPDATE profiles
SET usage_type = 'k12_school'
WHERE email = 'davecon12martin@outlook.com';
```

---

## ?? 9. Key Files Changed

**Modified:**
- `web/src/app/pricing/page.tsx` - Smart pricing
- `web/src/app/dashboard/parent/page.tsx` - Exam features

**Created:**
- `web/src/components/dashboard/parent/ExamWeekBanner.tsx`
- `web/src/components/dashboard/parent/EmergencyExamHelp.tsx`
- `web/src/components/dashboard/parent/QuickSubjectPractice.tsx`
- `web/src/components/dashboard/parent/ExamTips.tsx`

---

## ?? 10. What to Look For

### **Success Indicators:**
? Pricing page shows back button when logged in  
? No redundant trial messaging  
? Exam week banner visible  
? Emergency help button prominent  
? Quick practice works  
? Exam tips helpful  
? Purple banner ONLY for org parents  
? No console errors  
? All CTAs functional  

---

## ?? Ready to Test!

1. Start dev server: `cd web && npm run dev`
2. Visit pricing: `http://localhost:3000/pricing`
3. Visit dashboard: `http://localhost:3000/dashboard/parent`
4. Click all the new buttons
5. Check console logs
6. Report back what you see!

---

## ?? What to Send Me:

If issues persist:
1. **Screenshot** of dashboard
2. **Console logs** (the ?? ones)
3. **SQL query** result for your user
4. **Description** of what's wrong

---

**Files are ready for testing!** ??

The app should now be much more helpful for students preparing for exams next week! ????
