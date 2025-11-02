# 🤖 Dash AI - Test Questions Guide

## Quick Test (30 seconds)

### ✅ Simple Questions (To verify basic functionality)

1. **"Hello, who are you?"**
   - Expected: Dash introduces itself as an educational AI assistant for South African CAPS curriculum

2. **"What is photosynthesis?"**
   - Expected: Clear explanation with chemical equation (6CO₂ + 6H₂O → C₆H₁₂O₆ + 6O₂)
   - Should mention: chloroplasts, light energy, glucose production

3. **"Explain Pythagoras' theorem"**
   - Expected: a² + b² = c² with explanation and possibly a diagram description
   - Should mention: right-angled triangles, hypotenuse

## Educational Context Tests

### 📚 CAPS Curriculum Questions

4. **"What topics are covered in Grade 12 Life Sciences?"**
   - Expected: Cell biology, genetics, evolution, human systems, ecology

5. **"Help me prepare for my Grade 10 Math exam"**
   - Expected: Study tips, key topics (algebra, functions, trigonometry)
   - May reference exam papers if tool calling is enabled

6. **"What is the CAPS curriculum?"**
   - Expected: Curriculum and Assessment Policy Statement explanation
   - Should mention: South African education, Department of Basic Education

## Multi-Language Tests

### 🌍 Language Support (Test TTS later)

7. **"Verduidelik fotosintese in Afrikaans"** (Explain photosynthesis in Afrikaans)
   - Expected: Response in Afrikaans

8. **"Ngicela usizo ngezibalo"** (I need help with math - isiZulu)
   - Expected: Response acknowledging isiZulu, may switch to English with explanation

## Advanced Features Tests

### 🎯 Exam Paper Search (After tool calling enabled)

9. **"Find me Grade 12 Mathematics papers from 2024"**
   - Expected: List of papers from database
   - Should show: Mathematics P1, P2 with topics

10. **"Show me past papers about genetics"**
    - Expected: Life Sciences papers filtered by genetics topic
    - Should reference: Grade 12 papers with DNA, meiosis, evolution

11. **"I need practice with English comprehension"**
    - Expected: English Home Language papers
    - May suggest: Paper 1 (comprehension section)

### 🧪 Complex Educational Questions

12. **"Explain the difference between mitosis and meiosis"**
    - Expected: Detailed comparison table
    - Key points: 
      - Mitosis → 2 identical cells (growth/repair)
      - Meiosis → 4 different cells (gametes)

13. **"How do I solve quadratic equations?"**
    - Expected: Multiple methods
      - Factorization
      - Quadratic formula: x = (-b ± √(b²-4ac)) / 2a
      - Completing the square

14. **"What is the water cycle?"**
    - Expected: Evaporation → Condensation → Precipitation → Collection
    - Should mention: clouds, rain, rivers, ocean

## Markdown Formatting Tests

### 📝 Rich Content Rendering

15. **"Show me the quadratic formula with explanation"**
    - Expected: Proper math notation rendering
    - Should display: **x = (-b ± √(b²-4ac)) / 2a**

16. **"Give me a study schedule for Grade 12 finals"**
    - Expected: Formatted table or bullet list
    - Should include: Subjects, time allocation, break times

17. **"List the main organs of the human digestive system"**
    - Expected: Ordered or bullet list
    - Should include: Mouth → Esophagus → Stomach → Small intestine → Large intestine

## Edge Cases & Error Handling

### ⚠️ Testing Limits

18. **Very long question** (copy-paste a paragraph)
    - Expected: Handles gracefully, summarizes or asks to clarify

19. **Gibberish input:** "asdfghjkl qwerty"
    - Expected: Politely asks for clarification or valid question

20. **Off-topic:** "What's the weather today?"
    - Expected: Redirects to educational topics or politely declines

## Interactive Features (If enabled)

### 🎮 Exam Prep Mode

21. **"Start an exam practice session"**
    - Expected: Interactive exam interface loads
    - Should offer: Subject selection, difficulty level

22. **"Quiz me on Grade 10 Algebra"**
    - Expected: Multiple choice or practice questions
    - Should track: Progress, score, time

## Performance Tests

### ⚡ Speed & Reliability

23. **Ask 3 questions in quick succession**
    - Test: Response time consistency
    - Expected: Each response within 3-5 seconds

24. **Interrupt a long response**
    - Test: Stop button or new question
    - Expected: Graceful handling, no hanging state

---

## 🎯 Recommended Test Flow (5 minutes)

**Step 1: Basic Functionality (1 min)**
- Ask: "Hello, who are you?"
- Verify: Response appears, no errors

**Step 2: Educational Content (2 min)**
- Ask: "What is photosynthesis?"
- Verify: Detailed answer with chemical equation
- Ask: "Explain Pythagoras' theorem"
- Verify: Math formula renders properly

**Step 3: CAPS Context (1 min)**
- Ask: "Help me prepare for my Grade 12 Life Sciences exam"
- Verify: CAPS-specific guidance, topic lists

**Step 4: Advanced (1 min)**
- Ask: "Find me Grade 12 Math papers from 2024"
- Verify: 
  - If tool calling enabled → Shows papers from database
  - If not → Gives general advice about past papers

**Step 5: Markdown Rendering (30 sec)**
- Check: Headings, lists, bold text, math formulas
- Verify: ReactMarkdown rendering correctly

---

## ✅ Success Criteria

### Dash AI is working properly if:

- [x] Responds within 3-5 seconds
- [x] Answers are educational and CAPS-focused
- [x] Markdown renders (headings, lists, **bold**, formulas)
- [x] No 500 errors or crashes
- [x] Conversation history persists
- [x] Can handle follow-up questions
- [x] Claude Sonnet 3.7 model tag visible in response metadata

### Bonus (After tool calling enabled):

- [ ] Can search exam papers database
- [ ] Returns specific paper titles and topics
- [ ] Recommends papers based on student needs

---

## 🐛 Common Issues & Fixes

**Issue**: "AI_PROXY_ENABLED not configured"
- Fix: Check `.env.local` has `NEXT_PUBLIC_AI_PROXY_ENABLED=true`

**Issue**: 500 Internal Server Error
- Fix: Check Supabase edge function logs
- Verify: `SERVER_ANTHROPIC_API_KEY` is set

**Issue**: Response is generic, not CAPS-focused
- Fix: Model should be `claude-3-7-sonnet-20250219`
- Check: System prompt includes CAPS context

**Issue**: Math formulas not rendering
- Fix: ReactMarkdown with `remarkGfm` plugin should be enabled
- Check: LaTeX or plain text math rendering

**Issue**: Slow responses (>10 seconds)
- Check: Anthropic API rate limits
- Check: Network latency to Singapore region

---

## 📊 Where to Test

1. **Web App**: http://localhost:3000/dashboard/parent
   - Click "Ask Dash AI" widget
   - Or use `/exam-prep` page

2. **Mobile App**: (Expo)
   - Dash AI voice button
   - Text input widget

3. **Supabase Edge Function** (Direct test):
   ```bash
   curl -X POST https://your-project.supabase.co/functions/v1/ai-proxy-simple \
     -H "Authorization: Bearer YOUR_ANON_KEY" \
     -H "Content-Type: application/json" \
     -d '{"prompt": "What is photosynthesis?"}'
   ```

---

**Last Updated**: November 2, 2025  
**Model**: Claude Sonnet 3.7  
**Status**: ✅ Edge function deployed and working
