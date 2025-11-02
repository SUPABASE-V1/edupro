# Exam Database & Question Quality Debug Guide

## Issue 1: Database Save Error `{}`

### Root Cause
The empty error object `{}` typically indicates a **Row Level Security (RLS) policy violation** in Supabase. The database is blocking the insert, but Supabase's client returns an empty error object.

### Enhanced Error Logging ✅
We've updated `useExamSession.ts` to provide detailed diagnostics:

```typescript
// Now checks:
1. User authentication
2. Profile existence
3. Detailed error codes (PGRST116 = RLS violation)
4. All error properties (code, message, details, hint)
```

### How to Debug

#### Step 1: Check Browser Console
After generating an exam, look for these logs:

**✅ Success:**
```
[useExamSession] User profile found: { userId: "abc-123", role: "parent" }
[useExamSession] Saving exam generation: { userId: "abc-123", grade: "Grade 10", ... }
[useExamSession] ✅ Exam generation saved successfully: "xyz-789"
```

**❌ Profile Missing:**
```
[useExamSession] Profile check error: { code: "PGRST116", message: "No rows found" }
[useExamSession] User ID: abc-123
[useExamSession] ⚠️ Profile may not exist. Please ensure user has completed onboarding.
```

**❌ RLS Violation:**
```
[useExamSession] Save generation error: { code: "PGRST116", ... }
[useExamSession] ❌ RLS Policy Violation: User does not have INSERT permission
[useExamSession] 💡 This usually means:
   1. User profile does not exist in profiles table
   2. RLS policies are too restrictive
   3. User is not authenticated properly
```

#### Step 2: Verify Profile Exists
Run this in Supabase SQL Editor:

```sql
-- Check if current user has a profile
SELECT 
  id,
  email,
  role,
  created_at
FROM profiles
WHERE id = auth.uid();
```

**Expected Result:**
```
id                 | email            | role   | created_at
abc-123-...        | user@email.com   | parent | 2025-11-02 ...
```

**If Empty:** User needs to complete onboarding. Go to `/onboarding` or `/profiles-gate`.

#### Step 3: Test RLS Policies
```sql
-- Test INSERT permission
INSERT INTO exam_generations (
  user_id,
  grade,
  subject,
  exam_type,
  prompt,
  generated_content,
  display_title,
  status,
  model_used
) VALUES (
  auth.uid(),
  'Grade 10',
  'Mathematics',
  'practice_test',
  'Test exam',
  '{"test": true}',
  'Test Exam',
  'completed',
  'claude-3-5-sonnet-20240620'
)
RETURNING *;
```

**If it fails:** RLS policies are blocking. Check policies:

```sql
-- View all RLS policies on exam_generations
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'exam_generations';
```

#### Step 4: Fix Missing Profile

If profile is missing, you have 2 options:

**Option A: Complete Onboarding (Recommended)**
1. Navigate to `/onboarding` in your app
2. Select role (Parent/Teacher/Principal)
3. Complete profile setup

**Option B: Manual SQL Insert (For Testing)**
```sql
-- Insert profile manually
INSERT INTO profiles (id, email, role, full_name)
VALUES (
  auth.uid(),
  auth.email(),
  'parent',  -- or 'teacher', 'principal'
  'Test User'
)
ON CONFLICT (id) DO NOTHING;
```

---

## Issue 2: Nonsensical Questions

### Common Causes

#### 1. AI Not Following Tool Schema
The `generate_caps_exam` tool has strict requirements:
- ✅ Complete questions with ALL data
- ✅ Clear action verbs (Calculate, List, Identify)
- ❌ NO vague scenarios
- ❌ NO diagram references

**Bad Example:**
```
"Calculate the common difference in the sequence:"
```
❌ Missing the actual sequence!

**Good Example:**
```
"Calculate the common difference in this sequence: 2, 5, 8, 11, 14"
```
✅ Complete question with all data

#### 2. Model Hallucination
Sometimes Claude generates questions that don't make logical sense.

**Example from your screenshot:**
- "Circle the animal that is the tallest" → needs options (giraffe, elephant, etc.)
- "Write these numbers in order..." → needs the actual numbers

### How to Debug

#### Step 1: Check Edge Function Logs

**Supabase Dashboard:**
1. Go to **Edge Functions** → `ai-proxy` or `ai-proxy-simple`
2. Click **Logs** tab
3. Look for exam generation requests
4. Check the tool input and output

**Look for:**
```json
{
  "tool_use": [{
    "name": "generate_caps_exam",
    "input": {
      "sections": [{
        "questions": [{
          "text": "Circle the animal that is the tallest",  // ❌ Incomplete!
          "type": "multiple_choice",
          "options": []  // ❌ No options!
        }]
      }]
    }
  }]
}
```

#### Step 2: Check Validation Logic

In `ai-proxy/index.ts` at line ~1075, there's validation that should catch incomplete questions:

```typescript
// Validates:
1. All questions have action verbs
2. All questions have necessary data
3. Multiple choice questions have options
4. No diagram references
```

If validation passes but questions are still bad, the validation rules may need strengthening.

#### Step 3: Improve Prompts

**Current System Prompt:** (in `ai-proxy/index.ts`)
```
Every question MUST have:
1) Clear action verb (Calculate, List, Identify, etc.)
2) ALL required data (sequences, options, scenarios)
3) Specific instruction (NOT vague scenarios)
NO diagram references.
```

**You can enhance this by adding examples:**

```typescript
description: `Generate a structured, CAPS-aligned examination paper with complete questions.

CRITICAL RULES:
1. COMPLETE DATA: Every question must include ALL information needed
   ✅ "Calculate the common difference: 2, 5, 8, 11, 14"
   ❌ "Calculate the common difference in the sequence"

2. MULTIPLE CHOICE: Must include ALL options
   ✅ "Which holds more liquid? A) Teaspoon B) Cup C) Bucket"
   ❌ "Which holds more liquid?"

3. ORDERING: Must include ALL items to order
   ✅ "Write these in order from smallest to largest: 145, 23, 789, 56"
   ❌ "Write these numbers in order from smallest to largest"

4. NO DIAGRAMS: Never reference diagrams, charts, or images
   ❌ "Refer to the diagram above"
   ✅ Include all data in the question text
`
```

### Quick Fixes

#### Fix 1: Regenerate with Better Prompt
Instead of:
```
"Generate a Grade 2 Mathematics exam"
```

Use:
```
"Generate a Grade 2 Mathematics exam on Addition and Subtraction.
Include:
- 5 multiple choice questions with 4 options each
- 5 short answer calculation questions
- All questions must be complete with numbers provided
- No diagram references
Example: 'What is 15 + 23? A) 28 B) 38 C) 48 D) 58'"
```

#### Fix 2: Add Post-Generation Validation

In `AskAIWidget.tsx`, add validation before showing exam:

```typescript
// After parsing exam
if (parsedExam) {
  // Validate questions
  const hasIncompleteQuestions = parsedExam.sections.some(section =>
    section.questions.some(q => {
      // Check multiple choice has options
      if (q.type === 'multiple_choice' && (!q.options || q.options.length < 2)) {
        console.warn('[Exam Validation] Multiple choice question missing options:', q.text);
        return true;
      }
      
      // Check question has reasonable length (not just "Calculate:")
      if (q.text.length < 20) {
        console.warn('[Exam Validation] Question too short:', q.text);
        return true;
      }
      
      return false;
    })
  );
  
  if (hasIncompleteQuestions) {
    console.error('[Exam Validation] Exam has incomplete questions. Showing warning to user.');
    // Show warning message
    setMessages(m => [...m, {
      role: 'assistant',
      text: '⚠️ The generated exam has some incomplete questions. Would you like me to regenerate it with more detailed questions?'
    }]);
    return;
  }
  
  // Exam is valid
  setInteractiveExam(parsedExam);
}
```

---

## Testing Checklist

### Database Save
- [ ] Clear browser cache (`Ctrl + Shift + R`)
- [ ] Open browser console (F12)
- [ ] Generate an exam
- [ ] Check console for logs:
  - [ ] `[useExamSession] User profile found`
  - [ ] `[useExamSession] Saving exam generation`
  - [ ] `[useExamSession] ✅ Exam generation saved successfully`
- [ ] If error, note the error code and message
- [ ] Verify profile exists in Supabase (Step 2 above)
- [ ] Test RLS policies (Step 3 above)

### Question Quality
- [ ] Check Edge Function logs in Supabase
- [ ] Verify all multiple choice questions have options
- [ ] Verify all questions include necessary data
- [ ] Verify no "refer to diagram" text
- [ ] Try regenerating with more specific prompt
- [ ] Consider adding validation (Fix 2 above)

---

## SQL Helper Queries

### Check Recent Exam Generations
```sql
SELECT 
  id,
  display_title,
  grade,
  subject,
  exam_type,
  status,
  created_at,
  user_id
FROM exam_generations
WHERE user_id = auth.uid()
ORDER BY created_at DESC
LIMIT 10;
```

### Check User Progress
```sql
SELECT 
  ep.*,
  eg.display_title as exam_title
FROM exam_user_progress ep
LEFT JOIN exam_generations eg ON ep.exam_generation_id = eg.id
WHERE ep.user_id = auth.uid()
ORDER BY ep.started_at DESC;
```

### Find Incomplete Exams
```sql
SELECT 
  id,
  display_title,
  grade,
  subject,
  LENGTH(generated_content) as content_length,
  generated_content::jsonb->'sections' as sections
FROM exam_generations
WHERE user_id = auth.uid()
  AND status = 'completed'
ORDER BY created_at DESC;
```

### Check RLS Policy Issues
```sql
-- This shows if there are any permission issues
SELECT 
  has_table_privilege('exam_generations', 'INSERT') as can_insert,
  has_table_privilege('exam_generations', 'SELECT') as can_select,
  has_table_privilege('exam_generations', 'UPDATE') as can_update;
```

---

## Next Steps

1. **Clear browser cache** and test exam generation
2. **Check console logs** for detailed error messages
3. **Verify profile exists** in Supabase
4. **If profile missing:** Complete onboarding or run manual insert
5. **For bad questions:** Check Edge Function logs and consider adding validation
6. **Report findings:** Copy console logs and share for further debugging

---

## Need More Help?

If you're still seeing issues after following this guide:

1. **Copy full console logs** (everything starting with `[useExamSession]` or `[DashAI]`)
2. **Copy any SQL errors** from Supabase SQL Editor
3. **Screenshot** the problematic questions
4. **Share** your user role (parent/teacher/principal)
5. **Note** the exact prompt used to generate the exam

This will help diagnose the exact issue!
