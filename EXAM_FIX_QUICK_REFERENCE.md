# Quick Fix Reference Card

## 🎯 Main Issues Fixed

### 1. Database Save Error `{}`
**Problem:** Empty error object makes debugging impossible  
**Fix:** Enhanced error logging in `useExamSession.ts`  
**Test:** Check console for detailed error messages

### 2. Nonsensical Questions
**Problem:** Using `ai-proxy-simple` (no tool support)  
**Fix:** Switched to `ai-proxy` (structured exam generation)  
**Test:** Questions should now have complete data + options

---

## ⚡ Quick Test Steps

1. **Clear cache**: `Ctrl + Shift + R`
2. **Open console**: F12
3. **Generate exam**: "Create a Grade 2 Math exam"
4. **Check logs**:
   ```
   [useExamSession] User profile found ✅
   [useExamSession] ✅ Exam generation saved successfully
   ```
5. **Verify questions** have options and complete data

---

## 🔧 If Still Broken

### Database Error
```bash
# Check profile exists
SELECT * FROM profiles WHERE id = auth.uid();

# If empty, complete onboarding at /onboarding
# OR run:
INSERT INTO profiles (id, email, role, full_name)
VALUES (auth.uid(), auth.email(), 'parent', 'Test User');
```

### Bad Questions
```bash
# Verify ai-proxy is deployed
supabase functions list

# Redeploy if needed
supabase functions deploy ai-proxy

# Check ANTHROPIC_API_KEY is set in Supabase Dashboard
```

---

## 📝 Files Changed

- `web/src/lib/hooks/useExamSession.ts` - Better error logging
- `web/src/components/dashboard/AskAIWidget.tsx` - Use ai-proxy instead of ai-proxy-simple

---

## 📚 Full Documentation

- **Detailed debugging**: `EXAM_DATABASE_DEBUG_GUIDE.md`
- **Complete fix summary**: `EXAM_GENERATION_FIX_SUMMARY.md`

---

## ✅ Expected Results

### Good Questions (After Fix)
```
✅ "What is 15 + 23?
    A) 28  B) 38  C) 48  D) 58"

✅ "Which animal is tallest?
    A) Giraffe  B) Elephant  C) Lion"

✅ "Write from smallest to largest: 145, 23, 789, 56"
```

### Bad Questions (Before Fix)
```
❌ "Calculate the common difference in the sequence:"  (no sequence!)
❌ "Circle the tallest animal"  (no options!)
❌ "Write these numbers in order:"  (no numbers!)
```

---

**Test now and report results!** 🚀
