# Conversation Context Fix - Missing History in AI Requests

## Problem Identified

**Issue**: Dash AI doesn't maintain conversation context. When a user answers "Yes" to a question, Dash doesn't know what they're referring to because each message is sent independently without conversation history.

**Root Cause**: The `AskAIWidget.tsx` component sends each user message to the AI proxy **without including previous conversation history**.

---

## Current Broken Flow

### What Happens Now:
```
User: "Can you help me prepare for my math exam?"
→ AI Proxy receives: { prompt: "Can you help me prepare for my math exam?" }
→ Dash: "Of course! Would you like me to generate a practice test?"

User: "Yes"
→ AI Proxy receives: { prompt: "Yes" } ❌ NO CONTEXT!
→ Dash: "I'm not sure what you're referring to. Can you provide more details?"
```

**Why it fails**: The AI has no memory of asking about the practice test.

---

## How It Should Work

### Expected Flow:
```
User: "Can you help me prepare for my math exam?"
→ AI Proxy receives: 
{
  prompt: "Can you help me prepare for my math exam?"
}
→ Dash: "Of course! Would you like me to generate a practice test?"

User: "Yes"
→ AI Proxy receives: 
{
  prompt: "Yes",
  conversationHistory: [
    { role: "user", content: "Can you help me prepare for my math exam?" },
    { role: "assistant", content: "Of course! Would you like me to generate a practice test?" }
  ]
}
✅ Dash: "Great! Let me generate a practice test for you..."
```

---

## Technical Analysis

### Backend (AI Proxy) - Already Supports Conversation History ✅

**File**: `supabase/functions/ai-proxy/types.ts`
```typescript
export interface AIRequestPayload {
  prompt: string
  context?: string
  metadata?: Record<string, any>
  conversationHistory?: Array<{ role: string; content: any }> // ✅ SUPPORTED!
}
```

**File**: `supabase/functions/ai-proxy/ai-client/anthropic-client.ts`
```typescript
export async function callAnthropicAPI({
  prompt,
  conversationHistory, // ✅ Parameter exists
  // ...
}: {
  prompt: string
  conversationHistory?: ConversationMessage[]
  // ...
}): Promise<AIResponse> {
  const response = await anthropic.messages.create({
    messages: conversationHistory || [ // ✅ Uses history if provided
      { role: 'user', content: prompt }
    ],
    // ...
  })
}
```

**Conclusion**: The backend is **ready** to handle conversation history - it just needs to be sent from the frontend!

---

### Frontend (AskAIWidget) - NOT Sending History ❌

**File**: `web/src/components/dashboard/AskAIWidget.tsx` (Lines 115-130)

**Current Broken Code**:
```typescript
const { data, error } = await supabase.functions.invoke('ai-proxy', {
  body: {
    scope: 'parent',
    service_type: 'homework_help',
    enable_tools: true,
    payload: {
      prompt: text, // ❌ Only sends current message
      context: enableInteractive ? 'caps_exam_preparation' : 'general_question',
      metadata: {
        source: enableInteractive ? 'exam_generator' : 'dashboard',
        language: language || 'en-ZA',
        enableInteractive: enableInteractive
      }
      // ❌ NO conversationHistory field!
    },
    metadata: {
      role: 'parent'
    }
  },
  headers: token ? { Authorization: `Bearer ${token}` } : undefined,
});
```

**State Management**:
```typescript
const [messages, setMessages] = useState<{ role: 'user' | 'assistant' | 'tool'; text: string; tool?: any }[]>([]);
```

The `messages` array exists locally but is **never sent to the AI proxy**.

---

## The Fix

### Step 1: Build Conversation History from Messages Array

Before sending a request, convert the local `messages` array into the format expected by the AI proxy:

```typescript
const buildConversationHistory = (messages: typeof messages) => {
  return messages.map(msg => ({
    role: msg.role === 'tool' ? 'assistant' : msg.role, // Map tool responses to assistant
    content: msg.text
  }));
};
```

### Step 2: Include History in AI Proxy Request

**Fixed Code**:
```typescript
const { data, error } = await supabase.functions.invoke('ai-proxy', {
  body: {
    scope: 'parent',
    service_type: 'homework_help',
    enable_tools: true,
    payload: {
      prompt: text,
      context: enableInteractive ? 'caps_exam_preparation' : 'general_question',
      conversationHistory: buildConversationHistory(messages), // ✅ ADD THIS!
      metadata: {
        source: enableInteractive ? 'exam_generator' : 'dashboard',
        language: language || 'en-ZA',
        enableInteractive: enableInteractive
      }
    },
    metadata: {
      role: 'parent'
    }
  },
  headers: token ? { Authorization: `Bearer ${token}` } : undefined,
});
```

### Step 3: Test the Fix

**Test Scenario**:
1. Open Dash AI widget
2. Ask: "Can you help me with Grade 9 Mathematics?"
3. Dash responds: "Of course! What topic would you like to focus on?"
4. Reply: "Algebra"
5. Dash should remember the context and respond appropriately

**Expected Behavior**:
- ✅ Dash remembers previous questions
- ✅ Short answers like "Yes", "No", "Algebra" work naturally
- ✅ Multi-turn conversations flow smoothly

---

## Additional Improvements

### 1. Exam Prep Widget - Only Uses Tool, No Conversation

**Current Issue**: The `ExamPrepWidget` forces tool use with this prompt:
```typescript
IMPORTANT: You MUST use the 'generate_caps_exam' tool to create this exam. 
Do NOT write markdown. Use the generate_caps_exam tool now.
```

This **prevents natural conversation** before exam generation.

**Suggested Fix**: Allow conversational exam refinement:
```typescript
// OLD (Rigid):
"Generate an exam for Grade 9 Mathematics. Use the generate_caps_exam tool now."

// NEW (Conversational):
"I'd like to help you prepare for your Grade 9 Mathematics exam. 

What specific topics would you like to focus on? For example:
- Algebra (equations, inequalities, graphs)
- Geometry (theorems, proofs, measurements)
- Trigonometry (ratios, angles, applications)
- All topics (comprehensive practice test)

Just tell me what you need, and I'll create a CAPS-aligned practice test for you."
```

Then the conversation can flow:
```
User: "Algebra"
Dash: "Great! Would you like to focus on:
       1. Basic equations and inequalities
       2. Linear graphs and functions
       3. Quadratic equations
       4. All algebra topics"

User: "Quadratic equations"
Dash: "Perfect! I'll create a practice test focusing on quadratic equations.
       [Uses generate_caps_exam tool with specific focus]"
```

### 2. Conversation Persistence Across Sessions

The widget has conversation persistence hooks but they're not used:

```typescript
// Line 53-56
const { 
  messages: persistedMessages, 
  saveMessages 
} = useAIConversation(conversationId || null); // ✅ Exists but not used!
```

**Enhancement**: Save and restore conversations:
```typescript
// On mount: Load previous conversation
useEffect(() => {
  if (persistedMessages && persistedMessages.length > 0) {
    setMessages(persistedMessages);
  }
}, [persistedMessages]);

// On new message: Save to database
useEffect(() => {
  if (messages.length > 0 && conversationId) {
    saveMessages(messages);
  }
}, [messages, conversationId, saveMessages]);
```

---

## Implementation Priority

### Priority 1: Fix Conversation Context (Immediate) 🔴
- **File**: `AskAIWidget.tsx`
- **Change**: Add `conversationHistory` to AI proxy requests
- **Impact**: Makes Dash AI functional for multi-turn conversations
- **Effort**: 10 minutes

### Priority 2: Remove Forced Tool Use in Exam Prep (High) 🟠
- **File**: `ExamPrepWidget.tsx`
- **Change**: Allow conversation before forcing tool use
- **Impact**: Natural exam preparation flow
- **Effort**: 30 minutes

### Priority 3: Add Conversation Persistence (Medium) 🟡
- **File**: `AskAIWidget.tsx`
- **Change**: Use existing `useAIConversation` hook
- **Impact**: Resume previous conversations
- **Effort**: 20 minutes

---

## Files to Modify

1. **`web/src/components/dashboard/AskAIWidget.tsx`** (Main fix)
   - Add `buildConversationHistory()` helper
   - Include `conversationHistory` in AI proxy request
   - Optionally: Wire up conversation persistence

2. **`web/src/components/dashboard/exam-prep/ExamPrepWidget.tsx`** (Optional improvement)
   - Make tool use conditional, not forced
   - Allow conversational refinement before generation

3. **Test files**:
   - Test multi-turn conversations
   - Test "Yes/No" responses in context
   - Test exam prep flow with conversation

---

## Expected Results After Fix

### Before:
```
User: "Help with math exam"
Dash: "Sure! Grade?"
User: "Grade 9"
Dash: "I don't understand. What do you need?" ❌
```

### After:
```
User: "Help with math exam"
Dash: "Sure! What grade are you in?"
User: "Grade 9"
Dash: "Perfect! What topic would you like to practice?" ✅
User: "Algebra"
Dash: "Great! I'll create an algebra practice test for Grade 9..." ✅
```

---

**Status**: Ready to implement  
**Estimated Time**: 1 hour for all three improvements  
**Breaking Changes**: None  
**Backward Compatibility**: ✅ Yes (conversationHistory is optional in backend)
