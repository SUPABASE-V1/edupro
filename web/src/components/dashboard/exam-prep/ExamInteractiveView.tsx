'use client';

import { useState } from 'react';
import { CheckCircle2, XCircle, FileCheck, AlertCircle, Bot, Sparkles } from 'lucide-react';
import { ParsedExam, ExamQuestion, gradeAnswer } from '@/lib/examParser';
import { useExamSession } from '@/lib/hooks/useExamSession';
import { createClient } from '@/lib/supabase/client';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { ExamDiagram } from './ExamDiagram';

interface ExamInteractiveViewProps {
  exam: ParsedExam;
  generationId?: string | null;
  onClose?: () => void;
}

interface StudentAnswers {
  [questionId: string]: string;
}

interface QuestionFeedback {
  isCorrect: boolean;
  feedback: string;
  marks: number;
}

export function ExamInteractiveView({ exam, generationId, onClose }: ExamInteractiveViewProps) {
  const [studentAnswers, setStudentAnswers] = useState<StudentAnswers>({});
  const [submitted, setSubmitted] = useState(false);
  const [feedback, setFeedback] = useState<Record<string, QuestionFeedback>>({});
  const [score, setScore] = useState<{ earned: number; total: number } | null>(null);
  const [explanations, setExplanations] = useState<Record<string, string>>({});
  const [loadingExplanations, setLoadingExplanations] = useState(false);
  const [saving, setSaving] = useState(false);
  
  const { saveProgress } = useExamSession(generationId || null);

  const handleAnswerChange = (questionId: string, answer: string) => {
    setStudentAnswers((prev) => ({
      ...prev,
      [questionId]: answer,
    }));
  };
  
  /**
   * Get AI-powered explanations for incorrect answers
   */
  const getAIExplanations = async () => {
    setLoadingExplanations(true);
    const supabase = createClient();
    
    // Get all questions
    const allQuestions = exam.sections.flatMap(s => s.questions);
    
    // For each wrong answer, ask Dash AI for explanation
    for (const [qId, qFeedback] of Object.entries(feedback)) {
      if (!qFeedback.isCorrect) {
        const question = allQuestions.find(q => q.id === qId);
        
        if (!question) continue;
        
        try {
          const { data, error: invokeError } = await supabase.functions.invoke('ai-proxy-simple', {
            body: {
              payload: {
                prompt: `You are a helpful South African tutor explaining exam answers to ${exam.grade || 'Grade 12'} students.

QUESTION (${question.marks} marks): ${question.text}
${question.options ? `\nOPTIONS:\n${question.options.map((opt, idx) => `${String.fromCharCode(65 + idx)}. ${opt}`).join('\n')}` : ''}

STUDENT'S ANSWER: ${studentAnswers[qId] || 'No answer provided'}

CORRECT ANSWER: ${question.correctAnswer || 'See marking memorandum'}

Please provide a clear, encouraging explanation that includes:
1. Why the student's answer is incorrect
2. The correct approach step-by-step
3. Common mistakes to avoid
4. A helpful tip to remember this concept

Use simple, encouraging language. Be concise but thorough.`,
                context: 'exam_explanation',
                metadata: { language: 'en-ZA', grade: exam.grade || 'Grade 12' }
              }
            }
          });
          
          if (invokeError) {
            console.error(`[ExamInteractiveView] AI Error for ${qId}:`, invokeError);
            setExplanations(prev => ({
              ...prev,
              [qId]: '❌ **Failed to load explanation**\n\nPlease try again later or contact support if the issue persists.'
            }));
            continue;
          }
          
          if (data?.content) {
            setExplanations(prev => ({
              ...prev,
              [qId]: data.content
            }));
          } else {
            setExplanations(prev => ({
              ...prev,
              [qId]: '⚠️ **No explanation available**\n\nThe AI did not return a response. Please try again.'
            }));
          }
        } catch (error) {
          console.error(`[ExamInteractiveView] Exception for ${qId}:`, error);
          setExplanations(prev => ({
            ...prev,
            [qId]: '❌ **An error occurred**\n\nWe encountered an unexpected error while fetching the explanation. Please try again.'
          }));
        }
      }
    }
    
    setLoadingExplanations(false);
  };

  const handleSubmit = async () => {
    setSaving(true);
    const feedbackResults: Record<string, QuestionFeedback> = {};
    let earnedMarks = 0;

    exam.sections.forEach((section) => {
      section.questions.forEach((question) => {
        const answer = studentAnswers[question.id] || '';
        const result = gradeAnswer(question, answer);
        feedbackResults[question.id] = result;
        earnedMarks += result.marks;
      });
    });

    setFeedback(feedbackResults);
    const finalScore = { earned: earnedMarks, total: exam.totalMarks };
    setScore(finalScore);
    setSubmitted(true);

    // Save progress to database
    await saveProgress(
      studentAnswers,
      finalScore,
      exam.title,
      exam.grade || 'Grade 12',
      exam.subject || 'General'
    );
    
    setSaving(false);

    // Scroll to top to see results
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const renderQuestion = (question: ExamQuestion) => {
    const answer = studentAnswers[question.id] || '';
    const questionFeedback = feedback[question.id];
    const isAnswered = answer.trim() !== '';

    return (
      <div
        key={question.id}
        style={{
          padding: 'var(--space-4)',
          background: 'var(--card)',
          borderRadius: 'var(--radius-2)',
          border: submitted
            ? `2px solid ${questionFeedback?.isCorrect ? 'var(--success)' : 'var(--danger)'}`
            : '1px solid var(--border)',
          marginBottom: 'var(--space-4)',
        }}
      >
        {/* Question Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 'var(--space-3)' }}>
          <div style={{ flex: 1 }}>
            <p style={{ fontWeight: 600, fontSize: 15, marginBottom: 'var(--space-2)' }}>
              {question.text}
            </p>
          </div>
          <div style={{
            background: 'var(--primary)',
            color: '#fff',
            padding: '4px 8px',
            borderRadius: 'var(--radius-1)',
            fontSize: 12,
            fontWeight: 600,
            marginLeft: 'var(--space-2)',
          }}>
            [{question.marks} {question.marks === 1 ? 'mark' : 'marks'}]
          </div>
        </div>

        {/* Diagram (if present) */}
        {question.diagram && <ExamDiagram diagram={question.diagram} />}

        {/* Question Input */}
        {question.type === 'multiple_choice' && question.options ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
            {question.options.map((option, idx) => {
              const optionLetter = String.fromCharCode(65 + idx); // A, B, C, D
              const isSelected = answer === optionLetter;
              return (
                <label
                  key={idx}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    padding: 'var(--space-3)',
                    background: isSelected ? 'rgba(var(--primary-rgb), 0.1)' : 'var(--surface)',
                    border: isSelected ? '2px solid var(--primary)' : '1px solid var(--border)',
                    borderRadius: 'var(--radius-2)',
                    cursor: submitted ? 'not-allowed' : 'pointer',
                    opacity: submitted ? 0.7 : 1,
                  }}
                >
                  <input
                    type="radio"
                    name={question.id}
                    value={optionLetter}
                    checked={isSelected}
                    onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                    disabled={submitted}
                    style={{ marginRight: 'var(--space-2)' }}
                  />
                  <span style={{ fontSize: 14 }}>
                    <strong>{optionLetter}.</strong> {option}
                  </span>
                </label>
              );
            })}
          </div>
        ) : question.type === 'essay' ? (
          <textarea
            value={answer}
            onChange={(e) => handleAnswerChange(question.id, e.target.value)}
            disabled={submitted}
            placeholder="Write your answer here..."
            rows={6}
            style={{
              width: '100%',
              padding: 'var(--space-3)',
              borderRadius: 'var(--radius-2)',
              border: '1px solid var(--border)',
              background: 'var(--surface)',
              color: 'var(--text)',
              fontSize: 14,
              fontFamily: 'inherit',
              resize: 'vertical',
            }}
          />
        ) : (
          <input
            type={question.type === 'numeric' ? 'number' : 'text'}
            value={answer}
            onChange={(e) => handleAnswerChange(question.id, e.target.value)}
            disabled={submitted}
            placeholder="Enter your answer..."
            style={{
              width: '100%',
              padding: 'var(--space-3)',
              borderRadius: 'var(--radius-2)',
              border: '1px solid var(--border)',
              background: 'var(--surface)',
              color: 'var(--text)',
              fontSize: 14,
            }}
          />
        )}

        {/* Feedback */}
        {submitted && questionFeedback && (
          <>
            <div
              style={{
                marginTop: 'var(--space-3)',
                padding: 'var(--space-3)',
                background: questionFeedback.isCorrect
                  ? 'rgba(52, 199, 89, 0.1)'
                  : 'rgba(255, 59, 48, 0.1)',
                borderRadius: 'var(--radius-2)',
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--space-2)',
              }}
            >
              {questionFeedback.isCorrect ? (
                <CheckCircle2 className="w-5 h-5" style={{ color: 'var(--success)' }} />
              ) : (
                <XCircle className="w-5 h-5" style={{ color: 'var(--danger)' }} />
              )}
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: 13, margin: 0 }}>{questionFeedback.feedback}</p>
                <p className="muted" style={{ fontSize: 12, marginTop: 4, marginBottom: 0 }}>
                  Marks awarded: {questionFeedback.marks}/{question.marks}
                </p>
              </div>
            </div>
            
            {/* AI Explanation (if available) */}
            {explanations[question.id] && (
              <div style={{
                marginTop: 'var(--space-3)',
                padding: 'var(--space-4)',
                background: 'linear-gradient(135deg, rgba(124, 58, 237, 0.05), rgba(124, 58, 237, 0.1))',
                borderRadius: 'var(--radius-2)',
                borderLeft: '3px solid var(--primary)',
                boxShadow: '0 2px 8px rgba(124, 58, 237, 0.1)'
              }}>
                <div style={{ 
                  fontWeight: 600, 
                  marginBottom: 'var(--space-3)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  color: 'var(--primary)'
                }}>
                  <Bot className="icon20" />
                  <span style={{ fontSize: 15 }}>?? Dash AI Explanation</span>
                </div>
                <div className="markdown-content" style={{ fontSize: 14, lineHeight: 1.6 }}>
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {explanations[question.id]}
                  </ReactMarkdown>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    );
  };

  const answeredCount = Object.values(studentAnswers).filter(a => a.trim() !== '').length;
  const totalQuestions = exam.sections.reduce((sum, s) => sum + s.questions.length, 0);

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: 'var(--space-4)' }}>
      {/* Header */}
      <div style={{
        padding: 'var(--space-4)',
        background: 'var(--card)',
        borderRadius: 'var(--radius-2)',
        marginBottom: 'var(--space-4)',
      }}>
        <h1 style={{ fontSize: 24, fontWeight: 'bold', marginBottom: 'var(--space-2)' }}>
          {exam.title}
        </h1>

        {/* Score Display (if submitted) */}
        {submitted && score && (
          <div style={{
            padding: 'var(--space-4)',
            background: score.earned / score.total >= 0.5
              ? 'linear-gradient(135deg, rgba(52, 199, 89, 0.1) 0%, rgba(52, 199, 89, 0.2) 100%)'
              : 'linear-gradient(135deg, rgba(255, 149, 0, 0.1) 0%, rgba(255, 149, 0, 0.2) 100%)',
            borderRadius: 'var(--radius-2)',
            border: '2px solid',
            borderColor: score.earned / score.total >= 0.5 ? 'var(--success)' : 'var(--warning)',
            marginBottom: 'var(--space-3)',
            textAlign: 'center',
          }}>
            <div style={{ fontSize: 36, fontWeight: 'bold', marginBottom: 'var(--space-2)' }}>
              {score.earned}/{score.total}
            </div>
            <div style={{ fontSize: 18, fontWeight: 600 }}>
              {Math.round((score.earned / score.total) * 100)}% Score
            </div>
            <p className="muted" style={{ fontSize: 13, marginTop: 'var(--space-2)', marginBottom: 0 }}>
              {score.earned / score.total >= 0.8 ? '?? Outstanding!' :
               score.earned / score.total >= 0.7 ? '? Well done!' :
               score.earned / score.total >= 0.5 ? '?? Good effort!' :
               '?? Keep practicing!'}
            </p>
          </div>
        )}

        {/* Instructions */}
        {exam.instructions.length > 0 && !submitted && (
          <div style={{ marginTop: 'var(--space-3)' }}>
            <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 'var(--space-2)' }}>
              Instructions:
            </h3>
            <ul style={{ paddingLeft: 'var(--space-4)', margin: 0 }}>
              {exam.instructions.map((instruction, idx) => (
                <li key={idx} style={{ fontSize: 14, marginBottom: 'var(--space-1)' }}>
                  {instruction}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Progress Indicator */}
        {!submitted && (
          <div style={{
            marginTop: 'var(--space-3)',
            padding: 'var(--space-3)',
            background: 'var(--surface)',
            borderRadius: 'var(--radius-2)',
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--space-2)',
          }}>
            <AlertCircle className="w-5 h-5" style={{ color: 'var(--primary)' }} />
            <span style={{ fontSize: 14 }}>
              Answered: {answeredCount}/{totalQuestions} questions
            </span>
          </div>
        )}
      </div>

      {/* Sections */}
      {exam.sections.map((section, sectionIdx) => (
        <div key={sectionIdx} style={{ marginBottom: 'var(--space-4)' }}>
          <h2 style={{
            fontSize: 20,
            fontWeight: 'bold',
            marginBottom: 'var(--space-3)',
            padding: 'var(--space-3)',
            background: 'var(--primary)',
            color: '#fff',
            borderRadius: 'var(--radius-2)',
          }}>
            {section.title}
          </h2>
          {section.questions.map(renderQuestion)}
        </div>
      ))}

      {/* Submit Button */}
      {!submitted && (
        <div style={{ position: 'sticky', bottom: 0, padding: 'var(--space-4)', background: 'var(--bg)', borderTop: '1px solid var(--border)', zIndex: 10 }}>
          <button
            className="btn btnPrimary"
            onClick={handleSubmit}
            disabled={answeredCount === 0 || saving}
            style={{ width: '100%', fontSize: 16, padding: 'var(--space-4)' }}
          >
            <FileCheck className="icon16" />
            {saving ? 'Submitting...' : `Submit Exam (${answeredCount}/${totalQuestions} answered)`}
          </button>
          {answeredCount === 0 && (
            <p className="muted text-center" style={{ fontSize: 12, marginTop: 'var(--space-2)', marginBottom: 0 }}>
              Please answer at least one question before submitting
            </p>
          )}
        </div>
      )}
      
      {/* AI Explanations Button */}
      {submitted && Object.values(feedback).some(f => !f.isCorrect) && (
        <div style={{ 
          marginTop: 'var(--space-4)', 
          padding: 'var(--space-4)',
          background: 'linear-gradient(135deg, var(--surface), var(--surface-2))',
          borderRadius: 'var(--radius-2)',
          border: '1px solid var(--border)',
          textAlign: 'center'
        }}>
          <div style={{ marginBottom: 'var(--space-3)' }}>
            <Sparkles style={{ width: 32, height: 32, color: 'var(--primary)', margin: '0 auto' }} />
          </div>
          <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 'var(--space-2)' }}>
            Need help understanding your mistakes?
          </h3>
          <p className="muted" style={{ fontSize: 14, marginBottom: 'var(--space-4)', maxWidth: 500, margin: '0 auto var(--space-4)' }}>
            Dash AI can provide detailed step-by-step explanations for each question you got wrong, helping you learn from your mistakes.
          </p>
          <button 
            className="btn btnPrimary"
            onClick={getAIExplanations}
            disabled={loadingExplanations || Object.keys(explanations).length > 0}
            style={{ 
              fontSize: 16, 
              padding: 'var(--space-3) var(--space-6)',
              minWidth: 280
            }}
          >
            <Bot className="icon20" />
            {loadingExplanations 
              ? 'Getting Explanations...' 
              : Object.keys(explanations).length > 0
              ? '✓ Explanations Loaded'
              : '🤖 Get AI Explanations'}
          </button>
          {Object.keys(explanations).length > 0 && (
            <p className="muted" style={{ fontSize: 12, marginTop: 'var(--space-2)', marginBottom: 0 }}>
              ? Scroll up to see explanations for each incorrect answer
            </p>
          )}
        </div>
      )}

      {/* Close Button (after submission) */}
      {submitted && onClose && (
        <div style={{ marginTop: 'var(--space-4)', textAlign: 'center' }}>
          <button
            className="btn btnSecondary"
            onClick={onClose}
            style={{ padding: 'var(--space-3) var(--space-6)' }}
          >
            Return to Dashboard
          </button>
        </div>
      )}
    </div>
  );
}
