/**
 * useExamSession Hook
 * 
 * Manages exam session persistence to database.
 * Saves generated exams and tracks user progress.
 */

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';

export interface ExamSession {
  id: string;
  examData: any;  // Parsed exam structure from examParser
  userAnswers: Record<string, string>;
  submitted: boolean;
  score: { earned: number; total: number } | null;
  startedAt: string;
  completedAt?: string;
}

export interface ExamProgress {
  id: string;
  examTitle: string;
  grade: string;
  subject: string;
  scoreObtained: number;
  scoreTotal: number;
  percentage: number;
  completedAt: string;
}

export function useExamSession(generationId: string | null) {
  const supabase = createClient();
  const [session, setSession] = useState<ExamSession | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Load existing exam generation on mount
  useEffect(() => {
    if (!generationId) {
      setLoading(false);
      return;
    }
    
    const loadSession = async () => {
      try {
        const { data, error } = await supabase
          .from('exam_generations')
          .select('*')
          .eq('id', generationId)
          .single();
        
        if (error) {
          console.error('[useExamSession] Load error:', error);
          setLoading(false);
          return;
        }
        
        if (data) {
          setSession({
            id: data.id,
            examData: JSON.parse(data.generated_content),
            userAnswers: {},
            submitted: false,
            score: null,
            startedAt: data.created_at
          });
        }
      } catch (err) {
        console.error('[useExamSession] Exception:', err);
      } finally {
        setLoading(false);
      }
    };
    
    loadSession();
  }, [generationId]);
  
  /**
   * Save a new exam generation to database
   * Returns the generation ID
   */
  const saveExamGeneration = async (
    examData: any,
    prompt: string,
    title: string,
    grade?: string,
    subject?: string
  ): Promise<string | null> => {
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session) {
        console.error('[useExamSession] Not authenticated');
        return null;
      }
      
      const { data, error } = await supabase
        .from('exam_generations')
        .insert({
          user_id: sessionData.session.user.id,
          grade: grade || examData.grade || 'unknown',
          subject: subject || examData.subject || 'General',
          exam_type: 'practice_test',
          prompt,
          generated_content: JSON.stringify(examData),
          display_title: title,
          status: 'completed',
          model_used: 'claude-3-5-sonnet-20240620',
          viewed_at: new Date().toISOString()
        })
        .select()
        .single();
      
      if (error) {
        console.error('[useExamSession] Save generation error:', error);
        return null;
      }
      
      console.log('[useExamSession] Exam generation saved:', data.id);
      return data.id;
    } catch (err) {
      console.error('[useExamSession] Exception:', err);
      return null;
    }
  };
  
  /**
   * Save user progress after exam submission
   */
  const saveProgress = async (
    answers: Record<string, string>,
    score: { earned: number; total: number },
    examTitle: string,
    grade: string,
    subject: string
  ): Promise<boolean> => {
    if (!session && !generationId) {
      console.warn('[useExamSession] No session or generationId');
      return false;
    }
    
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session) {
        console.error('[useExamSession] Not authenticated');
        return false;
      }
      
      const percentage = (score.earned / score.total) * 100;
      
      const { error } = await supabase.from('exam_user_progress').insert({
        user_id: sessionData.session.user.id,
        exam_generation_id: generationId || session?.id || null,
        grade,
        subject,
        exam_title: examTitle,
        score_obtained: score.earned,
        score_total: score.total,
        percentage,
        completed_at: new Date().toISOString(),
        section_scores: answers  // Store all answers as JSON
      });
      
      if (error) {
        console.error('[useExamSession] Save progress error:', error);
        return false;
      }
      
      console.log(`[useExamSession] Progress saved: ${percentage.toFixed(1)}%`);
      return true;
    } catch (err) {
      console.error('[useExamSession] Exception:', err);
      return false;
    }
  };
  
  /**
   * Get user's exam history
   */
  const getExamHistory = async (): Promise<ExamProgress[]> => {
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session) return [];
      
      const { data, error } = await supabase
        .from('exam_user_progress')
        .select('*')
        .eq('user_id', sessionData.session.user.id)
        .order('completed_at', { ascending: false })
        .limit(20);
      
      if (error) {
        console.error('[useExamSession] Get history error:', error);
        return [];
      }
      
      return (data || []).map((row: any) => ({
        id: row.id,
        examTitle: row.exam_title,
        grade: row.grade,
        subject: row.subject,
        scoreObtained: row.score_obtained,
        scoreTotal: row.score_total,
        percentage: row.percentage,
        completedAt: row.completed_at
      }));
    } catch (err) {
      console.error('[useExamSession] Exception:', err);
      return [];
    }
  };
  
  return {
    session,
    setSession,
    saveExamGeneration,
    saveProgress,
    getExamHistory,
    loading
  };
}
