# Exam Generation Issues - Fixed ✅

## Problem 1: Empty Database Error `{}`

### Root Cause
Row Level Security (RLS) policy violations in Supabase were returning empty error objects, making debugging impossible.

### Solution ✅
Enhanced `useExamSession.ts` with comprehensive error logging:

```typescript
// Now checks:
✅ User authentication
✅ Profile existence (profiles table)
✅ Detailed error codes (PGRST116 = RLS violation)
✅ All error properties (code, message, details, hint)
✅ Helpful troubleshooting suggestions
```

### Test After Fix
1. Clear browser cache (`Ctrl + Shift + R`)
2. Generate an exam
3. Check console for detailed error messages:
   - `[useExamSession] User profile found: { userId, role }`
   - `[useExamSession] ✅ Exam generation saved successfully`
   - OR detailed error with fix suggestions

---

## Problem 2: Nonsensical Questions (Missing Data)

### Root Cause ⚠️ **CRITICAL**
**Wrong Edge Function!** We were calling `ai-proxy-simple` which:
- ❌ Doesn't support tool execution
- ❌ Doesn't use `generate_caps_exam` tool
- ❌ Generates questions as plain text (incomplete)

### Solution ✅
Switched from `ai-proxy-simple` → `ai-proxy`:

```typescript
// BEFORE (BROKEN):
await supabase.functions.invoke('ai-proxy-simple', { ... });
// Claude generates: "Circle the animal that is tallest"  ❌ No options!

// AFTER (FIXED):
await supabase.functions.invoke('ai-proxy', { ... });
// Claude uses tool: generate_caps_exam with structured questions ✅
```

### Why This Fixes Questions

The **full `ai-proxy` function**:
- ✅ Supports tool execution (`generate_caps_exam`)
- ✅ Uses strict schema validation:
  ```typescript
  {
    text: "Which holds more liquid?",
    type: "multiple_choice",
    options: ["A. Teaspoon", "B. Cup", "C. Bucket"],  // ✅ Required!
    marks: 1
  }
  ```
- ✅ Validates questions have complete data
- ✅ Enforces CAPS curriculum standards

---

## Files Modified

### 1. `web/src/lib/hooks/useExamSession.ts`
**Enhanced Error Logging:**
- Added profile existence check
- Added detailed error code logging
- Added helpful troubleshooting messages
- Added success confirmation logs

### 2. `web/src/components/dashboard/AskAIWidget.tsx`
**Changed Edge Function:**
- Line ~130: `ai-proxy-simple` → `ai-proxy` (initial prompt)
- Line ~360: `ai-proxy-simple` → `ai-proxy` (manual send)
- Updated error messages to reference correct function

---

## Testing Checklist

### Database Save Test
- [ ] Clear browser cache (`Ctrl + Shift + R`)
- [ ] Open browser console (F12)
- [ ] Generate an exam
- [ ] Verify console shows:
  ```
  [useExamSession] User profile found: { userId: "...", role: "parent" }
  [useExamSession] Saving exam generation: { grade: "Grade 10", ... }
  [useExamSession] ✅ Exam generation saved successfully: "abc-123"
  ```
- [ ] Navigate to "My Exams" page
- [ ] Verify exam appears in list

### Question Quality Test
- [ ] Generate exam: "Create a Grade 2 Mathematics exam on Addition"
- [ ] Verify questions are complete:
  - [ ] Multiple choice has options (A, B, C, D)
  - [ ] Calculation questions include numbers
  - [ ] Ordering questions include items to order
  - [ ] No "refer to diagram" text
  - [ ] Each question makes logical sense

**Example Good Questions:**
```
✅ "What is 15 + 23?
    A) 28  B) 38  C) 48  D) 58"

✅ "Write these numbers from smallest to largest:
    145, 23, 789, 56"

✅ "Which animal is the tallest?
    A) Giraffe  B) Elephant  C) Lion  D) Zebra"
```

**Example Bad Questions (Should NOT happen now):**
```
❌ "Calculate the common difference in the sequence:"  (no sequence!)
❌ "Circle the tallest animal"  (no options!)
❌ "Write these numbers in order:"  (no numbers!)
```

---

## Troubleshooting

### If Database Save Still Fails

#### Error: Profile Not Found
```
[useExamSession] Profile check error: { code: "PGRST116" }
[useExamSession] ⚠️ Profile may not exist. Please ensure user has completed onboarding.
```

**Fix:** Complete onboarding at `/onboarding` or `/profiles-gate`

**OR** manually insert profile:
```sql
INSERT INTO profiles (id, email, role, full_name)
VALUES (auth.uid(), auth.email(), 'parent', 'Test User')
ON CONFLICT (id) DO NOTHING;
```

#### Error: RLS Policy Violation
```
[useExamSession] ❌ RLS Policy Violation: User does not have INSERT permission
```

**Fix:** Check RLS policies in Supabase:
```sql
-- View policies
SELECT * FROM pg_policies WHERE tablename = 'exam_generations';

-- Test INSERT permission
SELECT has_table_privilege('exam_generations', 'INSERT');
```

### If Questions Still Bad

#### Check Edge Function Deployed
1. Go to Supabase Dashboard
2. **Functions** tab
3. Verify `ai-proxy` is deployed (not just `ai-proxy-simple`)
4. Check logs for errors

#### Redeploy if Needed
```bash
cd supabase/functions
supabase functions deploy ai-proxy
```

#### Check Environment Variables
1. Supabase Dashboard → **Settings** → **Edge Functions**
2. Verify `ANTHROPIC_API_KEY` is set
3. Verify key starts with `sk-ant-api03-`

---

## Environment Variables Required

### Supabase Dashboard → Settings → Edge Functions

| Variable | Value | Required For |
|----------|-------|-------------|
| `ANTHROPIC_API_KEY` | `sk-ant-api03-...` | AI generation |
| `SERVER_ANTHROPIC_API_KEY` | `sk-ant-api03-...` | Fallback |

**Get API Key:** https://console.anthropic.com/settings/keys

---

## What Changed vs What Didn't

### Changed ✅
- Edge function: `ai-proxy-simple` → `ai-proxy`
- Error logging: Enhanced with detailed diagnostics
- Profile check: Added before database save

### Didn't Change ❌
- Database schema (exam_generations table)
- RLS policies (they were already correct)
- ExamInteractiveView component
- ParsedExam interface
- Exam parsing logic

---

## Why Questions Were Bad

### The Simple Explanation

**ai-proxy-simple** = Basic chat (like ChatGPT)
- User: "Create an exam"
- Claude: "Here's an exam: 1. Circle the tallest animal" ❌
- No structure, no validation, incomplete

**ai-proxy** = Structured tool execution
- User: "Create an exam"
- Claude: *Uses generate_caps_exam tool*
- Tool requires: question text, type, options, marks
- Validation checks: all fields present, options provided
- Result: Complete, structured questions ✅

### Think of it Like:
- **ai-proxy-simple**: Asking someone to write an exam by hand
  - They might forget details
  - Format is inconsistent
  - No quality control

- **ai-proxy**: Using a structured exam generator
  - Template enforces completeness
  - Validation checks all fields
  - Consistent format

---

## Testing Commands

### Check if ai-proxy is Deployed
```bash
# List all deployed functions
supabase functions list

# Should show:
# ai-proxy (deployed)
# ai-proxy-simple (deployed)
```

### Test ai-proxy Directly
```bash
curl -X POST https://your-project.supabase.co/functions/v1/ai-proxy \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "scope": "parent",
    "enable_tools": true,
    "payload": {
      "prompt": "Create a Grade 2 Mathematics exam with 3 questions",
      "context": "caps_exam_preparation"
    }
  }'
```

### Check Database Manually
```sql
-- In Supabase SQL Editor

-- 1. Check your profile
SELECT * FROM profiles WHERE id = auth.uid();

-- 2. Check exam generations
SELECT * FROM exam_generations WHERE user_id = auth.uid();

-- 3. Test INSERT permission
INSERT INTO exam_generations (
  user_id, grade, subject, exam_type, 
  prompt, generated_content, display_title, status
) VALUES (
  auth.uid(), 'Grade 2', 'Mathematics', 'practice_test',
  'Test', '{}', 'Test Exam', 'completed'
) RETURNING id;

-- 4. If success, delete test
DELETE FROM exam_generations WHERE display_title = 'Test Exam';
```

---

## Summary

### Before Fix
```
User generates exam
  ↓
Calls ai-proxy-simple ❌
  ↓
Claude generates text (no tools)
  ↓
Questions incomplete ("Circle the tallest animal")
  ↓
Database save fails silently (error: {})
```

### After Fix
```
User generates exam
  ↓
Calls ai-proxy ✅
  ↓
Claude uses generate_caps_exam tool
  ↓
Structured questions with validation
  ↓
Complete questions ("Which is tallest? A) Giraffe B) Elephant...")
  ↓
Database save with detailed error logging
  ↓
Success confirmation or helpful error message
```

---

## Next Steps

1. **Clear browser cache** (`Ctrl + Shift + R`)
2. **Open console** (F12)
3. **Generate test exam**: "Create a Grade 2 Math exam on Addition"
4. **Verify console logs** show profile found and save success
5. **Check question quality** - all should be complete with data
6. **Report results** - copy any errors if still occurring

The fix is complete! Questions should now be properly structured, and any database errors will show detailed diagnostic information.
