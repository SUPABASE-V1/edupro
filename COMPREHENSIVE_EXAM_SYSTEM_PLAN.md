# ?? Comprehensive Exam System - Complete Plan

**Date:** 2025-11-01  
**Status:** Database Ready, Implementation Plan

---

## ? What Already Exists

### **Database Tables (Already Created):**
1. ? `past_papers` - Store official CAPS past papers
2. ? `exam_generations` - Store AI-generated exams  
3. ? `exam_user_progress` - Track user attempts & scores
4. ? `ai_conversations` - Store chat history
5. ? `caps_exam_questions` - Question bank
6. ? `caps_exam_patterns` - Exam pattern analysis

### **Frontend Components (Already Working):**
1. ? `ExamInteractiveView` - Interactive exam taking with auto-grading
2. ? `ExamPrepWidget` - Generate practice tests
3. ? `AskAIWidget` - AI chat interface
4. ? `examParser.ts` - Parse exam markdown to structured format

---

## ?? Three Key Features to Implement

### **1. Download & Store Past Papers**
### **2. Persist AI Conversations**  
### **3. Enhanced Interactive Exam System**

---

## ?? SOLUTION 1: Past Papers Integration

### **Database Schema (Already Exists):**
```sql
CREATE TABLE past_papers (
  id UUID PRIMARY KEY,
  grade TEXT,           -- 'grade_9', 'grade_10', etc.
  subject TEXT,         -- 'Mathematics', 'Physical Sciences'
  year INT,            -- 2023, 2024
  term INT,            -- 1, 2, 3, 4
  paper_number INT,    -- 1, 2, 3
  title TEXT,          -- 'Grade 12 Math Paper 1 2024'
  file_url TEXT,       -- Supabase Storage URL for PDF
  memo_file_url TEXT,  -- Memorandum PDF URL
  total_marks INT,
  duration_minutes INT,
  tags TEXT[]          -- ['algebra', 'calculus']
);
```

### **Where to Get Official Papers:**

**Department of Basic Education (DBE):**
- https://www.education.gov.za/Curriculum/NationalSeniorCertificate(NSC)Examinations.aspx
- https://www.education.gov.za/Curriculum/NationalSeniorCertificate(NSC)Examinations/NSCPastExaminationpapers.aspx

**Other Sources:**
- https://www.thutong.doe.gov.za/
- https://www.stanmorephysics.com/
- Provincial education departments

### **Implementation Plan:**

#### **Step 1: Create Storage Bucket**
```sql
-- In Supabase Dashboard: Storage > Create Bucket
Bucket name: exam-papers
Public: Yes (or use signed URLs)
```

#### **Step 2: Upload Script**
```typescript
// scripts/upload-past-papers.ts

import { createClient } from '@supabase/supabase-js';
import { readFile } from 'fs/promises';
import path from 'path';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

interface PastPaper {
  grade: string;
  subject: string;
  year: number;
  term: number;
  paperNumber: number;
  title: string;
  pdfPath: string;
  memoPath?: string;
  totalMarks: number;
  durationMinutes: number;
  tags: string[];
}

async function uploadPastPaper(paper: PastPaper) {
  // 1. Upload PDF to Storage
  const pdfFile = await readFile(paper.pdfPath);
  const pdfName = `${paper.grade}/${paper.subject}/${paper.year}/paper${paper.paperNumber}.pdf`;
  
  const { data: pdfData, error: pdfError } = await supabase.storage
    .from('exam-papers')
    .upload(pdfName, pdfFile, { contentType: 'application/pdf' });
  
  if (pdfError) throw pdfError;
  
  // 2. Upload Memo (if exists)
  let memoUrl = null;
  if (paper.memoPath) {
    const memoFile = await readFile(paper.memoPath);
    const memoName = `${paper.grade}/${paper.subject}/${paper.year}/memo${paper.paperNumber}.pdf`;
    
    const { data: memoData } = await supabase.storage
      .from('exam-papers')
      .upload(memoName, memoFile, { contentType: 'application/pdf' });
    
    memoUrl = supabase.storage.from('exam-papers').getPublicUrl(memoName).data.publicUrl;
  }
  
  const fileUrl = supabase.storage.from('exam-papers').getPublicUrl(pdfName).data.publicUrl;
  
  // 3. Insert into Database
  const { data, error } = await supabase
    .from('past_papers')
    .insert({
      grade: paper.grade,
      subject: paper.subject,
      year: paper.year,
      term: paper.term,
      paper_number: paper.paperNumber,
      title: paper.title,
      file_url: fileUrl,
      memo_file_url: memoUrl,
      total_marks: paper.totalMarks,
      duration_minutes: paper.durationMinutes,
      tags: paper.tags,
      is_public: true
    });
  
  if (error) throw error;
  console.log(`? Uploaded: ${paper.title}`);
}

// Usage:
const papers: PastPaper[] = [
  {
    grade: 'grade_12',
    subject: 'Mathematics',
    year: 2024,
    term: 4,
    paperNumber: 1,
    title: 'Grade 12 Mathematics Paper 1 - 2024',
    pdfPath: './papers/2024/grade12-math-p1.pdf',
    memoPath: './papers/2024/grade12-math-p1-memo.pdf',
    totalMarks: 150,
    durationMinutes: 180,
    tags: ['algebra', 'functions', 'calculus']
  },
  // Add more papers...
];

papers.forEach(paper => uploadPastPaper(paper));
```

#### **Step 3: Frontend - Browse Past Papers**
```tsx
// components/dashboard/parent/PastPapersLibrary.tsx

export function PastPapersLibrary() {
  const [papers, setPapers] = useState([]);
  const [filters, setFilters] = useState({ grade: 'all', subject: 'all' });
  
  useEffect(() => {
    const fetchPapers = async () => {
      let query = supabase.from('past_papers').select('*');
      
      if (filters.grade !== 'all') query = query.eq('grade', filters.grade);
      if (filters.subject !== 'all') query = query.eq('subject', filters.subject);
      
      const { data } = await query.order('year', { ascending: false });
      setPapers(data || []);
    };
    fetchPapers();
  }, [filters]);
  
  return (
    <div className="section">
      <div className="sectionTitle">?? Official Past Papers</div>
      
      {/* Filters */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
        <select 
          className="input" 
          value={filters.grade}
          onChange={(e) => setFilters(f => ({ ...f, grade: e.target.value }))}
        >
          <option value="all">All Grades</option>
          <option value="grade_10">Grade 10</option>
          <option value="grade_11">Grade 11</option>
          <option value="grade_12">Grade 12</option>
        </select>
        
        <select 
          className="input"
          value={filters.subject}
          onChange={(e) => setFilters(f => ({ ...f, subject: e.target.value }))}
        >
          <option value="all">All Subjects</option>
          <option value="Mathematics">Mathematics</option>
          <option value="Physical Sciences">Physical Sciences</option>
          <option value="Life Sciences">Life Sciences</option>
        </select>
      </div>
      
      {/* Papers Grid */}
      <div style={{ display: 'grid', gap: 12 }}>
        {papers.map(paper => (
          <div key={paper.id} className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 6 }}>
                  {paper.title}
                </div>
                <div style={{ fontSize: 13, color: 'var(--muted)' }}>
                  {paper.total_marks} marks ? {paper.duration_minutes} minutes
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <a 
                  href={paper.file_url} 
                  target="_blank"
                  className="btn btnPrimary"
                  style={{ fontSize: 13 }}
                >
                  ?? Download
                </a>
                {paper.memo_file_url && (
                  <a 
                    href={paper.memo_file_url}
                    target="_blank" 
                    className="btn"
                    style={{ fontSize: 13 }}
                  >
                    ?? Memo
                  </a>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
```

---

## ?? SOLUTION 2: Persist AI Conversations

### **Database Fix (ai_conversations requires preschool_id):**

**Issue:** Current schema requires `preschool_id`, but independent parents don't have one.

**Fix:**
```sql
-- Make preschool_id optional for independent parents
ALTER TABLE ai_conversations 
  ALTER COLUMN preschool_id DROP NOT NULL;

-- Update RLS policies
DROP POLICY "Users can view their own conversations" ON ai_conversations;
CREATE POLICY "Users can view their own conversations"
  ON ai_conversations FOR SELECT
  USING (user_id = auth.uid());

-- Same for INSERT, UPDATE, DELETE
```

### **Implementation:**

#### **File:** `lib/hooks/useAIConversation.ts`
```typescript
import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';

export interface AIMessage {
  id: string;
  role: 'user' | 'assistant' | 'tool';
  content: string;
  timestamp: string;
  metadata?: any;
}

export function useAIConversation(conversationId: string | null) {
  const supabase = createClient();
  const [messages, setMessages] = useState<AIMessage[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Load conversation on mount
  useEffect(() => {
    if (!conversationId) {
      setLoading(false);
      return;
    }
    
    const loadConversation = async () => {
      const { data } = await supabase
        .from('ai_conversations')
        .select('messages, title')
        .eq('conversation_id', conversationId)
        .single();
      
      if (data?.messages) {
        setMessages(data.messages);
      }
      setLoading(false);
    };
    
    loadConversation();
  }, [conversationId]);
  
  // Save messages to database
  const saveMessages = async (newMessages: AIMessage[], title: string) => {
    if (!conversationId) return;
    
    const { data: session } = await supabase.auth.getSession();
    if (!session.session) return;
    
    const { data: profile } = await supabase
      .from('profiles')
      .select('id, preschool_id')
      .eq('id', session.session.user.id)
      .single();
    
    // Upsert conversation
    await supabase.from('ai_conversations').upsert({
      conversation_id: conversationId,
      user_id: session.session.user.id,
      preschool_id: profile?.preschool_id || null,
      title,
      messages: newMessages,
      updated_at: new Date().toISOString()
    });
  };
  
  return {
    messages,
    setMessages,
    saveMessages,
    loading
  };
}
```

#### **Update AskAIWidget:**
```typescript
export function AskAIWidget({ 
  conversationId,  // NEW: Optional conversation ID for persistence
  ...otherProps 
}) {
  const { 
    messages, 
    setMessages, 
    saveMessages 
  } = useAIConversation(conversationId);
  
  // After getting AI response:
  const newMessages = [...messages, { role: 'assistant', content: aiResponse }];
  setMessages(newMessages);
  
  // Auto-save
  await saveMessages(newMessages, displayMessage || 'Chat');
}
```

#### **Usage in Dashboard:**
```typescript
// Generate unique conversation ID
const conversationId = `exam_prep_${Date.now()}_${Math.random().toString(36)}`;

<AskAIWidget
  conversationId={conversationId}  // Now saves automatically
  initialPrompt="Generate Math test"
  displayMessage="Math Practice Test"
/>
```

#### **View Past Conversations:**
```tsx
// components/dashboard/parent/SavedConversations.tsx

export function SavedConversations() {
  const [conversations, setConversations] = useState([]);
  
  useEffect(() => {
    const fetchConversations = async () => {
      const { data } = await supabase
        .from('ai_conversations')
        .select('*')
        .order('updated_at', { ascending: false })
        .limit(20);
      
      setConversations(data || []);
    };
    fetchConversations();
  }, []);
  
  return (
    <div className="section">
      <div className="sectionTitle">?? Recent AI Sessions</div>
      <div style={{ display: 'grid', gap: 12 }}>
        {conversations.map(conv => (
          <div key={conv.id} className="card" style={{ cursor: 'pointer' }}>
            <div style={{ fontWeight: 600, marginBottom: 4 }}>
              {conv.title}
            </div>
            <div style={{ fontSize: 12, color: 'var(--muted)' }}>
              {conv.messages.length} messages ? {formatDate(conv.updated_at)}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
```

---

## ?? SOLUTION 3: Enhanced Interactive Exam System

### **Current Issues:**
1. ? Exam data lost when modal closes
2. ? Can't review past exams
3. ? No detailed explanations for wrong answers
4. ? No progress tracking

### **Complete Fix:**

#### **File:** `lib/hooks/useExamSession.ts` (NEW)
```typescript
import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';

export interface ExamSession {
  id: string;
  examData: any;  // Parsed exam structure
  userAnswers: Record<string, string>;
  submitted: boolean;
  score: { earned: number; total: number } | null;
  startedAt: string;
  completedAt?: string;
}

export function useExamSession(generationId: string | null) {
  const supabase = createClient();
  const [session, setSession] = useState<ExamSession | null>(null);
  
  // Load or create session
  useEffect(() => {
    if (!generationId) return;
    
    const loadSession = async () => {
      // Try to load existing generation
      const { data: existing } = await supabase
        .from('exam_generations')
        .select('*')
        .eq('id', generationId)
        .single();
      
      if (existing) {
        setSession({
          id: existing.id,
          examData: JSON.parse(existing.generated_content),
          userAnswers: {},
          submitted: false,
          score: null,
          startedAt: existing.created_at
        });
      }
    };
    
    loadSession();
  }, [generationId]);
  
  // Save exam generation
  const saveExamGeneration = async (examData: any, prompt: string, title: string) => {
    const { data: sessionData } = await supabase.auth.getSession();
    if (!sessionData.session) return null;
    
    const { data, error } = await supabase
      .from('exam_generations')
      .insert({
        user_id: sessionData.session.user.id,
        grade: examData.grade || 'unknown',
        subject: examData.subject || 'General',
        exam_type: 'practice_test',
        prompt,
        generated_content: JSON.stringify(examData),
        display_title: title,
        status: 'completed',
        model_used: 'claude-3-5-sonnet'
      })
      .select()
      .single();
    
    if (error) throw error;
    return data.id;
  };
  
  // Save progress when user submits
  const saveProgress = async (answers: Record<string, string>, score: any) => {
    if (!session) return;
    
    const { data: sessionData } = await supabase.auth.getSession();
    if (!sessionData.session) return;
    
    await supabase.from('exam_user_progress').insert({
      user_id: sessionData.session.user.id,
      exam_generation_id: session.id,
      grade: session.examData.grade,
      subject: session.examData.subject,
      exam_title: session.examData.title,
      score_obtained: score.earned,
      score_total: score.total,
      percentage: (score.earned / score.total) * 100,
      completed_at: new Date().toISOString(),
      section_scores: answers  // Store answers as JSON
    });
  };
  
  return {
    session,
    saveExamGeneration,
    saveProgress
  };
}
```

#### **Update ExamInteractiveView:**
```typescript
export function ExamInteractiveView({ 
  exam, 
  onClose,
  generationId  // NEW: Link to exam_generations table
}: ExamInteractiveViewProps) {
  const { saveProgress } = useExamSession(generationId);
  
  const handleSubmit = async () => {
    // ... existing grading logic ...
    
    setFeedback(feedbackResults);
    setScore({ earned: earnedMarks, total: exam.totalMarks });
    setSubmitted(true);
    
    // NEW: Save progress to database
    await saveProgress(studentAnswers, { earned: earnedMarks, total: exam.totalMarks });
    
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  
  // ... rest of component
}
```

#### **Enhanced Feedback with AI Explanations:**
```typescript
// Add to ExamInteractiveView after submission

const [explanations, setExplanations] = useState<Record<string, string>>({});
const [loadingExplanations, setLoadingExplanations] = useState(false);

const getAIExplanations = async () => {
  setLoadingExplanations(true);
  
  // For each wrong answer, get AI explanation
  for (const [qId, qFeedback] of Object.entries(feedback)) {
    if (!qFeedback.isCorrect) {
      const question = findQuestionById(qId);
      const userAnswer = studentAnswers[qId];
      
      const { data } = await supabase.functions.invoke('ai-proxy-simple', {
        body: {
          payload: {
            prompt: `Question: ${question.text}\nStudent's answer: ${userAnswer}\nCorrect answer: ${question.correctAnswer}\n\nProvide a clear explanation of why the student's answer is incorrect and how to solve it correctly. Use simple language.`
          }
        }
      });
      
      setExplanations(prev => ({
        ...prev,
        [qId]: data.content
      }));
    }
  }
  
  setLoadingExplanations(false);
};

// Button to trigger
{submitted && (
  <button 
    className="btn btnPrimary"
    onClick={getAIExplanations}
    disabled={loadingExplanations}
  >
    ?? Get AI Explanations for Wrong Answers
  </button>
)}
```

---

## ?? SOLUTION 3: View Past Exams & Sessions

#### **File:** `app/dashboard/parent/my-exams/page.tsx` (NEW)
```typescript
export default function MyExamsPage() {
  const [exams, setExams] = useState([]);
  const [selectedExam, setSelectedExam] = useState(null);
  
  useEffect(() => {
    const fetchMyExams = async () => {
      const { data } = await supabase
        .from('exam_generations')
        .select(`
          *,
          progress:exam_user_progress(*)
        `)
        .order('created_at', { ascending: false });
      
      setExams(data || []);
    };
    fetchMyExams();
  }, []);
  
  return (
    <div className="app">
      <div className="container">
        <h1 className="h1">?? My Practice Exams</h1>
        
        <div style={{ display: 'grid', gap: 12 }}>
          {exams.map(exam => (
            <div key={exam.id} className="card">
              <div style={{ marginBottom: 12 }}>
                <div style={{ fontWeight: 700, fontSize: 16 }}>
                  {exam.display_title}
                </div>
                <div style={{ fontSize: 13, color: 'var(--muted)' }}>
                  {formatDate(exam.created_at)}
                </div>
              </div>
              
              {/* Show score if completed */}
              {exam.progress?.[0] && (
                <div style={{
                  padding: 12,
                  background: 'rgba(52, 199, 89, 0.1)',
                  borderRadius: 8,
                  marginBottom: 12
                }}>
                  <strong>{exam.progress[0].percentage}%</strong>
                  {' '}? {exam.progress[0].score_obtained}/{exam.progress[0].score_total} marks
                </div>
              )}
              
              <div style={{ display: 'flex', gap: 8 }}>
                <button 
                  className="btn btnPrimary"
                  onClick={() => setSelectedExam(exam)}
                >
                  {exam.progress?.[0] ? '?? Review' : '?? Take Exam'}
                </button>
                <button 
                  className="btn"
                  onClick={() => downloadExamPDF(exam)}
                >
                  ?? Download PDF
                </button>
              </div>
            </div>
          ))}
        </div>
        
        {/* Modal for viewing exam */}
        {selectedExam && (
          <ExamInteractiveView
            exam={JSON.parse(selectedExam.generated_content)}
            generationId={selectedExam.id}
            onClose={() => setSelectedExam(null)}
          />
        )}
      </div>
    </div>
  );
}
```

---

## ?? Implementation Summary

### **Files to Create (5):**
1. `scripts/upload-past-papers.ts` - Bulk upload official papers
2. `lib/hooks/useAIConversation.ts` - Persist chat history
3. `lib/hooks/useExamSession.ts` - Persist exam sessions
4. `components/dashboard/parent/PastPapersLibrary.tsx` - Browse past papers
5. `app/dashboard/parent/my-exams/page.tsx` - View saved exams

### **Files to Modify (2):**
1. `AskAIWidget.tsx` - Add conversation persistence
2. `ExamInteractiveView.tsx` - Add progress saving & AI explanations

### **Database Migrations (1):**
1. `fix_ai_conversations_for_independent_parents.sql` - Make preschool_id optional

---

## ?? Quick Implementation Order

### **Phase 1: Persistence (2 hours)**
1. ? Fix `ai_conversations` schema (remove NOT NULL on preschool_id)
2. ? Create `useAIConversation` hook
3. ? Update `AskAIWidget` to save conversations
4. ? Create `useExamSession` hook
5. ? Update `ExamInteractiveView` to save progress

### **Phase 2: Past Papers (4 hours)**
6. ? Create Storage bucket
7. ? Download official DBE papers (manual)
8. ? Create upload script
9. ? Upload 50-100 papers
10. ? Create `PastPapersLibrary` component
11. ? Add to dashboard

### **Phase 3: Saved Exams (2 hours)**
12. ? Create `/my-exams` page
13. ? List all generated exams
14. ? Show scores
15. ? Allow retakes
16. ? PDF export

### **Phase 4: AI Explanations (1 hour)**
17. ? Add "Get Explanations" button
18. ? Call AI for wrong answers
19. ? Display explanations beautifully

---

**Total Implementation Time: ~9 hours**

---

Let me create the actual implementation files next!
