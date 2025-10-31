'use client';

import { useEffect, useState } from 'react';
import { CheckCircle2, Loader2, Clock } from 'lucide-react';

interface ExamGenerationProgressProps {
  isGenerating: boolean;
  examType: string;
}

const GENERATION_STEPS = [
  { id: 'analyzing', label: 'Analyzing CAPS curriculum', duration: 8 },
  { id: 'selecting', label: 'Selecting age-appropriate questions', duration: 12 },
  { id: 'generating', label: 'Generating marking memorandum', duration: 15 },
  { id: 'formatting', label: 'Formatting exam paper', duration: 5 }
];

export function ExamGenerationProgress({ isGenerating, examType }: ExamGenerationProgressProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (!isGenerating) {
      setCurrentStep(0);
      setProgress(0);
      return;
    }

    // Simulate progress through steps
    const totalDuration = GENERATION_STEPS.reduce((sum, step) => sum + step.duration, 0);
    let elapsed = 0;

    const interval = setInterval(() => {
      elapsed += 1;
      const newProgress = Math.min((elapsed / totalDuration) * 100, 95); // Cap at 95%
      setProgress(newProgress);

      // Update current step
      let cumulativeDuration = 0;
      for (let i = 0; i < GENERATION_STEPS.length; i++) {
        cumulativeDuration += GENERATION_STEPS[i].duration;
        if (elapsed < cumulativeDuration) {
          setCurrentStep(i);
          break;
        }
      }

      // Stop at 95% and let actual completion set it to 100%
      if (elapsed >= totalDuration) {
        clearInterval(interval);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [isGenerating]);

  if (!isGenerating) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0, 0, 0, 0.7)',
      backdropFilter: 'blur(8px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9999,
      padding: 'var(--space-4)'
    }}>
      <div style={{
        background: 'var(--card)',
        borderRadius: 'var(--radius-3)',
        padding: 'var(--space-6)',
        maxWidth: '500px',
        width: '100%',
        border: '1px solid var(--border)',
        boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5)'
      }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 'var(--space-6)' }}>
          <div style={{
            width: '64px',
            height: '64px',
            margin: '0 auto var(--space-4)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'linear-gradient(135deg, var(--primary), var(--accent))',
            borderRadius: '50%'
          }}>
            <Loader2 className="w-8 h-8" style={{ color: '#fff', animation: 'spin 1s linear infinite' }} />
          </div>
          <h2 style={{ fontSize: 24, fontWeight: 'bold', marginBottom: 'var(--space-2)' }}>
            Generating {examType}
          </h2>
          <p className="muted" style={{ fontSize: 14 }}>
            This may take 30-60 seconds. Please don't close this window.
          </p>
        </div>

        {/* Progress Bar */}
        <div style={{
          width: '100%',
          height: '8px',
          background: 'var(--surface)',
          borderRadius: '4px',
          overflow: 'hidden',
          marginBottom: 'var(--space-6)'
        }}>
          <div style={{
            width: `${progress}%`,
            height: '100%',
            background: 'linear-gradient(90deg, var(--primary), var(--accent))',
            transition: 'width 0.5s ease-out',
            borderRadius: '4px'
          }} />
        </div>

        {/* Steps */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
          {GENERATION_STEPS.map((step, index) => {
            const isCompleted = index < currentStep;
            const isCurrent = index === currentStep;
            const isPending = index > currentStep;

            return (
              <div
                key={step.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 'var(--space-3)',
                  opacity: isPending ? 0.4 : 1,
                  transition: 'opacity 0.3s'
                }}
              >
                {/* Icon */}
                <div style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: isCompleted ? 'var(--success)' : isCurrent ? 'var(--primary)' : 'var(--surface)',
                  flexShrink: 0
                }}>
                  {isCompleted ? (
                    <CheckCircle2 className="w-4 h-4" style={{ color: '#fff' }} />
                  ) : isCurrent ? (
                    <Loader2 className="w-4 h-4" style={{ color: '#fff', animation: 'spin 1s linear infinite' }} />
                  ) : (
                    <Clock className="w-4 h-4" style={{ color: 'var(--text-muted)' }} />
                  )}
                </div>

                {/* Label */}
                <div style={{ flex: 1 }}>
                  <div style={{
                    fontSize: 14,
                    fontWeight: isCurrent ? 600 : 400,
                    color: isCurrent ? 'var(--text)' : 'var(--text-muted)'
                  }}>
                    {step.label}
                  </div>
                  {isCurrent && (
                    <div className="muted" style={{ fontSize: 12, marginTop: 2 }}>
                      In progress...
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Time Estimate */}
        <div style={{
          marginTop: 'var(--space-6)',
          padding: 'var(--space-3)',
          background: 'var(--surface)',
          borderRadius: 'var(--radius-2)',
          textAlign: 'center'
        }}>
          <p className="muted" style={{ fontSize: 12, margin: 0 }}>
            ⏱️ Estimated time remaining: {Math.max(0, Math.ceil((100 - progress) / 2.5))}s
          </p>
        </div>
      </div>

      {/* Spinning animation */}
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      ` }} />
    </div>
  );
}
