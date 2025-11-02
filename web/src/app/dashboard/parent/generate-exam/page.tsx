'use client';

import { useEffect, useState, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ParentShell } from '@/components/dashboard/parent/ParentShell';
import { useParentDashboardData } from '@/lib/hooks/useParentDashboardData';
import { ExamInteractiveView } from '@/components/dashboard/exam-prep/ExamInteractiveView';
import { useExamSession } from '@/lib/hooks/useExamSession';
import { createClient } from '@/lib/supabase/client';
import { parseExamMarkdown } from '@/lib/examParser';
import { Loader2, AlertCircle, ArrowLeft, Sparkles } from 'lucide-react';

function GenerateExamContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const {
    userId,
    profile,
    childrenCards,
    activeChildId,
    setActiveChildId,
    childrenLoading,
    metrics,
    unreadCount,
    trialStatus,
    loading: dashboardLoading,
    hasOrganization,
    usageType
  } = useParentDashboardData();
  
  const [generating, setGenerating] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [exam, setExam] = useState<any>(null);
  const [generationId, setGenerationId] = useState<string | null>(null);
  const [progress, setProgress] = useState<string>('Initializing...');
  const hasGeneratedRef = useRef(false);
  
  const { saveExamGeneration } = useExamSession(null);
  
  // Get params from URL
  const grade = searchParams.get('grade');
  const subject = searchParams.get('subject');
  const examType = searchParams.get('type');
  const language = searchParams.get('language') || 'en-ZA';
  const customPromptParam = searchParams.get('prompt');
  
  useEffect(() => {
    if (!grade || !subject || !examType) {
      setError('Missing exam parameters. Please go back and try again.');
      setGenerating(false);
      return;
    }
    
    if (!userId || dashboardLoading || hasGeneratedRef.current) {
      return;
    }
    
    hasGeneratedRef.current = true;
    generateExam();
  }, [grade, subject, examType, userId, dashboardLoading]);
  
  const generateExam = async () => {
    setGenerating(true);
    setError(null);
    setProgress('Preparing your exam...');
    
    try {
      const supabase = createClient();
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;
      
      if (!token) {
        throw new Error('Not authenticated');
      }
      
      // Format grade for display
      const gradeDisplay = grade.replace('grade_', 'Grade ').replace('_', ' ');
      
      // Use custom prompt if provided, otherwise use default
      const prompt = customPromptParam || `Generate an interactive, age-appropriate practice examination paper for ${gradeDisplay} ${subject} strictly aligned to the CAPS curriculum.

Requirements:
- Include diagrams where appropriate (charts, flowcharts, etc.)
- Make questions clear and self-contained
- Provide a mix of question types
- Ensure CAPS alignment
- Use age-appropriate language`;
      
      setProgress('Asking Dash AI to generate your exam...');
      
      const { data, error: invokeError } = await supabase.functions.invoke('ai-proxy', {
        body: {
          scope: 'parent',
          service_type: 'homework_help',
          enable_tools: true,
          payload: {
            prompt,
            context: 'caps_exam_preparation',
            metadata: {
              source: 'exam_generator',
              language,
              grade,
              subject,
              examType,
              enableInteractive: true
            }
          },
          metadata: { role: 'parent' }
        },
        headers: { Authorization: `Bearer ${token}` },
      });
      
      if (invokeError) {
        console.error('[GenerateExam] Invoke error:', invokeError);
        throw new Error(invokeError.message || 'Failed to invoke AI service');
      }
      
      setProgress('Processing exam data...');
      
      // Parse exam from tool results
      if (data?.tool_results && Array.isArray(data.tool_results)) {
        for (const toolResult of data.tool_results) {
          try {
            // Check if it's an error
            if (typeof toolResult.content === 'string' && toolResult.content.startsWith('Error:')) {
              throw new Error(toolResult.content);
            }
            
            const resultData = typeof toolResult.content === 'string' 
              ? JSON.parse(toolResult.content)
              : toolResult.content;
            
            if (resultData.success && resultData.data?.sections) {
              setProgress('Saving your exam...');
              
              // Save to database
              const genId = await saveExamGeneration(
                resultData.data,
                prompt,
                resultData.data.title || `${gradeDisplay} ${subject} Practice Test`,
                resultData.data.grade || grade,
                resultData.data.subject || subject
              );
              
              setGenerationId(genId);
              setExam(resultData.data);
              setGenerating(false);
              setProgress('Ready!');
              return;
            } else if (resultData.sections) {
              // Direct exam format (no success wrapper)
              setProgress('Saving your exam...');
              
              const genId = await saveExamGeneration(
                resultData,
                prompt,
                resultData.title || `${gradeDisplay} ${subject} Practice Test`,
                resultData.grade || grade,
                resultData.subject || subject
              );
              
              setGenerationId(genId);
              setExam(resultData);
              setGenerating(false);
              setProgress('Ready!');
              return;
            }
          } catch (parseError) {
            console.error('[GenerateExam] Parse error:', parseError);
            // Try next result
            continue;
          }
        }
      }
      
      // Fallback: Try markdown parsing
      const content = data?.content || '';
      if (content) {
        setProgress('Parsing exam content...');
        const parsedExam = parseExamMarkdown(content);
        
        if (parsedExam) {
          setProgress('Saving your exam...');
          
          const genId = await saveExamGeneration(
            parsedExam,
            prompt,
            parsedExam.title,
            parsedExam.grade || grade,
            parsedExam.subject || subject
          );
          
          setGenerationId(genId);
          setExam(parsedExam);
          setGenerating(false);
          setProgress('Ready!');
          return;
        }
      }
      
      throw new Error('Failed to parse exam data from AI response');
      
    } catch (err: any) {
      console.error('[GenerateExam] Error:', err);
      setError(err.message || 'Failed to generate exam. Please try again.');
      setGenerating(false);
      setProgress('');
    }
  };
  
  const handleClose = () => {
    router.push('/dashboard/parent');
  };
  
  if (dashboardLoading || !userId) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh'
      }}>
        <Loader2 className="icon32" style={{ animation: 'spin 1s linear infinite' }} />
      </div>
    );
  }
  
  return (
    <ParentShell
      userId={userId}
      profile={profile}
      activeChildId={activeChildId}
      setActiveChildId={setActiveChildId}
      childrenCards={childrenCards}
      childrenLoading={childrenLoading}
      metrics={metrics}
      unreadCount={unreadCount}
      trialStatus={trialStatus}
      loading={dashboardLoading}
      hasOrganization={hasOrganization}
      usageType={usageType}
    >
      <div style={{ padding: 'var(--space-4)' }}>
        {generating && (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '60vh',
            gap: '1.5rem'
          }}>
            <div style={{
              position: 'relative',
              width: '80px',
              height: '80px'
            }}>
              <div style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                animation: 'spin 2s linear infinite'
              }}>
                <Loader2 
                  className="icon32" 
                  style={{ 
                    color: 'var(--primary)',
                  }} 
                />
              </div>
              <Sparkles 
                className="icon32" 
                style={{ 
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                  color: 'var(--primary)',
                  animation: 'pulse 2s ease-in-out infinite'
                }} 
              />
            </div>
            
            <div style={{ textAlign: 'center' }}>
              <h1 style={{ 
                fontSize: '24px', 
                fontWeight: 700, 
                marginBottom: 'var(--space-2)',
                color: 'var(--text)'
              }}>
                Generating Your Exam
              </h1>
              <p style={{ 
                fontSize: '15px',
                color: 'var(--muted)', 
                marginBottom: 'var(--space-4)',
                maxWidth: '500px'
              }}>
                Dash AI is creating a {grade?.replace('grade_', 'Grade ').replace('_', ' ')} {subject} exam for you.
                <br />
                This may take 15-30 seconds.
              </p>
            </div>
            
            <div style={{
              padding: '1rem 2rem',
              background: 'var(--surface)',
              borderRadius: 'var(--radius-2)',
              border: '1px solid var(--border)',
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem'
            }}>
              <div style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                background: 'var(--primary)',
                animation: 'pulseOpacity 1.5s ease-in-out infinite'
              }} />
              <span style={{ fontSize: '14px', color: 'var(--muted)' }}>
                {progress}
              </span>
            </div>
            
            <button 
              onClick={handleClose}
              className="btn"
              style={{ marginTop: 'var(--space-4)' }}
            >
              <ArrowLeft className="icon16" />
              Cancel
            </button>
          </div>
        )}
        
        {error && (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '1.5rem',
            padding: '2rem',
            minHeight: '60vh',
            justifyContent: 'center'
          }}>
            <div style={{
              width: '80px',
              height: '80px',
              borderRadius: '50%',
              background: 'rgba(var(--danger-rgb), 0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <AlertCircle className="icon32" style={{ color: 'var(--danger)' }} />
            </div>
            
            <div style={{ textAlign: 'center', maxWidth: '500px' }}>
              <h2 style={{ 
                fontSize: '20px', 
                fontWeight: 600, 
                marginBottom: 'var(--space-2)' 
              }}>
                Generation Failed
              </h2>
              <p style={{ 
                color: 'var(--muted)', 
                fontSize: '15px',
                marginBottom: 'var(--space-4)'
              }}>
                {error}
              </p>
            </div>
            
            <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
              <button onClick={handleClose} className="btn">
                <ArrowLeft className="icon16" />
                Go Back
              </button>
              <button 
                onClick={() => {
                  hasGeneratedRef.current = false;
                  generateExam();
                }} 
                className="btn btnPrimary"
              >
                Try Again
              </button>
            </div>
          </div>
        )}
        
        {exam && !generating && (
          <ExamInteractiveView
            exam={exam}
            generationId={generationId}
            onClose={handleClose}
          />
        )}
      </div>
    </ParentShell>
  );
}

export default function GenerateExamPage() {
  return (
    <Suspense fallback={
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh'
      }}>
        <Loader2 className="icon32" style={{ animation: 'spin 1s linear infinite' }} />
      </div>
    }>
      <GenerateExamContent />
    </Suspense>
  );
}
