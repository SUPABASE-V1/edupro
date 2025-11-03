# Exam Generation Debugging Guide

## Current Issue
**Error**: "Generation Failed - Failed to parse exam data from AI response"

## Logs Analysis

### 1. Authentication Error (400)
```
POST | 400 | 102.66.159.128 
/auth/v1/token?grant_type=password
x_sb_error_code: invalid_credentials
```
**Issue**: User authentication failed with invalid credentials
**Impact**: If the user isn't properly authenticated, they can't call the AI proxy

### 2. Database Query Error (406)
```
GET | 406 | 13.39.19.200
/rest/v1/users?select=organization_id,preschool_id,subscription_tier,role&auth_user_id=eq.ac27a5fe-4004-4eeb-9acb-56bfa2c25405
```
**Issue**: 406 Not Acceptable - the `users` table query is failing
**Possible Causes**:
- The `users` table might not exist (should be `profiles` table instead)
- RLS policies might be blocking the query
- The columns requested don't exist in the table

## Fixes Applied

### 1. Enhanced Error Logging
Added detailed console logging to see the actual AI response:
```typescript
console.log('[GenerateExam] AI Response:', JSON.stringify(data, null, 2));
```

### 2. Better Error Details
Enhanced error logging to show full error context:
```typescript
console.error('[GenerateExam] Full error details:', {
  message: err.message,
  stack: err.stack,
  data: err.data
});
```

## Next Steps

1. **Check Browser Console**:
   - Open Developer Tools
   - Go to Console tab
   - Look for `[GenerateExam] AI Response:` to see what the AI is actually returning
   - Look for `[GenerateExam] Full error details:` to see the exact error

2. **Verify Authentication**:
   - Make sure the user is logged in properly
   - Check if the JWT token is valid
   - Verify the user has the correct role (parent)

3. **Check AI Proxy Response**:
   - The AI proxy should return `tool_results` array
   - Each tool result should have exam data with `sections`
   - Format should match one of:
     - `{ success: true, data: { sections: [...] } }`
     - `{ sections: [...] }` (direct format)

4. **Database Issues**:
   - Check if the AI proxy is trying to query `users` table (should be `profiles`)
   - Verify RLS policies allow the query
   - Check Edge Function logs in Supabase dashboard

## Expected AI Response Format

The exam generation should return data in this format:

```json
{
  "tool_results": [
    {
      "tool_use_id": "...",
      "content": {
        "success": true,
        "data": {
          "title": "Grade 9 Mathematics Practice Test",
          "grade": "grade_9",
          "subject": "Mathematics",
          "duration": 60,
          "totalMarks": 50,
          "instructions": ["...", "..."],
          "sections": [
            {
              "title": "Section A: Multiple Choice",
              "instructions": "Choose the correct answer",
              "questions": [...]
            }
          ]
        }
      }
    }
  ]
}
```

## How to Test

1. **Try generating an exam**
2. **Open browser console (F12)**
3. **Click "Try Again" on the error screen**
4. **Check console for**:
   - `[GenerateExam] AI Response:` - See what data is being returned
   - `[GenerateExam] Full error details:` - See the exact parsing error
   - Network tab - Check the `/ai-proxy` request/response

## Common Issues

### Issue: AI returns plain text instead of JSON
**Fix**: The AI proxy should use tools (exam_generator) to return structured data

### Issue: Missing tool_results in response
**Fix**: Check if `enable_tools: true` is being passed and the AI proxy has the exam_generator tool registered

### Issue: Authentication failing
**Fix**: User needs to sign out and sign in again with correct credentials

### Issue: 406 on users table
**Fix**: Update the AI proxy or quota checker to use `profiles` table instead of `users`
