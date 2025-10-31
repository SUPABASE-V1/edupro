'use client';

import { useState, useEffect } from 'react';
import { FileText, Clock, CheckCircle, AlertCircle, Calendar } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

interface AssignedExam {
  assignment_id: string;
  exam_title: string;
  teacher_name: string;
  subject: string;
  grade: string;
  due_date: string;
  status: string;
  my_submission_id: string | null;
  my_score: number | null;
  submitted_at: string | null;
}

export default function StudentExamsPage() {
  const router = useRouter();
  const [exams, setExams] = useState<AssignedExam[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAssignedExams();
  }, []);

  const loadAssignedExams = async () => {
    setLoading(true);
    try {
      const supabase = createClient();
      const { data, error } = await supabase.rpc('get_my_exam_assignments');

      if (error) {
        console.error('Error loading exams:', error);
      } else {
        setExams(data || []);
      }
    } catch (err) {
      console.error('Unexpected error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleStartExam = async (assignment: AssignedExam) => {
    try {
      const supabase = createClient();
      
      // Check if can submit
      const { data: canSubmit } = await supabase.rpc('can_submit_exam', {
        assignment_uuid: assignment.assignment_id
      });

      if (!canSubmit?.can_submit) {
        alert('⚠️ Cannot start exam\n\n' + (canSubmit?.reason || 'Unknown reason'));
        return;
      }

      // Navigate to exam
      router.push(`/exam-prep?assignment=${assignment.assignment_id}`);
    } catch (err) {
      console.error('Error starting exam:', err);
      alert('Failed to start exam');
    }
  };

  const getStatusColor = (exam: AssignedExam) => {
    if (exam.my_submission_id) return 'var(--success)';
    if (exam.due_date && new Date(exam.due_date) < new Date()) return 'var(--danger)';
    return 'var(--warning)';
  };

  const getStatusText = (exam: AssignedExam) => {
    if (exam.my_submission_id) return 'Completed';
    if (exam.due_date && new Date(exam.due_date) < new Date()) return 'Overdue';
    return 'Pending';
  };

  const getStatusIcon = (exam: AssignedExam) => {
    if (exam.my_submission_id) return <CheckCircle className="w-4 h-4" />;
    if (exam.due_date && new Date(exam.due_date) < new Date()) return <AlertCircle className="w-4 h-4" />;
    return <Clock className="w-4 h-4" />;
  };

  return (
    <div style={{ padding: 'var(--space-4)', maxWidth: '1200px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: 'var(--space-6)' }}>
        <h1 style={{ fontSize: 32, fontWeight: 'bold', marginBottom: 'var(--space-2)' }}>
          📝 My Assigned Exams
        </h1>
        <p className="muted" style={{ fontSize: 14 }}>
          Complete your assigned exams before the due date
        </p>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--space-4)', marginBottom: 'var(--space-6)' }}>
        <div className="card" style={{ padding: 'var(--space-4)', border: '1px solid var(--border)', borderRadius: 'var(--radius-2)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-2)' }}>
            <Clock className="w-5 h-5" style={{ color: 'var(--warning)' }} />
            <span className="muted" style={{ fontSize: 13 }}>Pending</span>
          </div>
          <div style={{ fontSize: 28, fontWeight: 'bold' }}>
            {exams.filter(e => !e.my_submission_id).length}
          </div>
        </div>

        <div className="card" style={{ padding: 'var(--space-4)', border: '1px solid var(--border)', borderRadius: 'var(--radius-2)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-2)' }}>
            <CheckCircle className="w-5 h-5" style={{ color: 'var(--success)' }} />
            <span className="muted" style={{ fontSize: 13 }}>Completed</span>
          </div>
          <div style={{ fontSize: 28, fontWeight: 'bold' }}>
            {exams.filter(e => e.my_submission_id).length}
          </div>
        </div>

        <div className="card" style={{ padding: 'var(--space-4)', border: '1px solid var(--border)', borderRadius: 'var(--radius-2)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-2)' }}>
            <AlertCircle className="w-5 h-5" style={{ color: 'var(--danger)' }} />
            <span className="muted" style={{ fontSize: 13 }}>Overdue</span>
          </div>
          <div style={{ fontSize: 28, fontWeight: 'bold' }}>
            {exams.filter(e => !e.my_submission_id && e.due_date && new Date(e.due_date) < new Date()).length}
          </div>
        </div>

        <div className="card" style={{ padding: 'var(--space-4)', border: '1px solid var(--border)', borderRadius: 'var(--radius-2)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-2)' }}>
            <FileText className="w-5 h-5" style={{ color: 'var(--primary)' }} />
            <span className="muted" style={{ fontSize: 13 }}>Average Score</span>
          </div>
          <div style={{ fontSize: 28, fontWeight: 'bold' }}>
            {exams.filter(e => e.my_score !== null).length > 0
              ? Math.round(exams.filter(e => e.my_score !== null).reduce((sum, e) => sum + (e.my_score || 0), 0) / exams.filter(e => e.my_score !== null).length)
              : '-'}%
          </div>
        </div>
      </div>

      {/* Exam List */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: 'var(--space-8)' }}>
          <div className="spinner" />
          <p className="muted" style={{ marginTop: 'var(--space-2)' }}>Loading exams...</p>
        </div>
      ) : exams.length === 0 ? (
        <div style={{
          textAlign: 'center',
          padding: 'var(--space-8)',
          background: 'var(--surface)',
          borderRadius: 'var(--radius-2)',
          border: '1px dashed var(--border)'
        }}>
          <FileText className="w-12 h-12" style={{ color: 'var(--text-muted)', margin: '0 auto var(--space-4)' }} />
          <h3 style={{ fontSize: 18, fontWeight: 600, marginBottom: 'var(--space-2)' }}>
            No exams assigned yet
          </h3>
          <p className="muted">
            Your teacher will assign exams for you to complete
          </p>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: 'var(--space-4)' }}>
          {exams.map((exam) => (
            <div
              key={exam.assignment_id}
              className="card"
              style={{
                padding: 'var(--space-4)',
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--space-4)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-2)',
                borderLeft: `4px solid ${getStatusColor(exam)}`
              }}
            >
              {/* Icon */}
              <div style={{
                width: '48px',
                height: '48px',
                borderRadius: 'var(--radius-2)',
                background: getStatusColor(exam),
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}>
                <FileText className="w-6 h-6" style={{ color: '#fff' }} />
              </div>

              {/* Info */}
              <div style={{ flex: 1 }}>
                <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 4 }}>
                  {exam.exam_title}
                </h3>
                <div style={{ display: 'flex', gap: 'var(--space-4)', fontSize: 13, flexWrap: 'wrap' }} className="muted">
                  <span>👨‍🏫 {exam.teacher_name}</span>
                  <span>📚 {exam.subject}</span>
                  <span>🎓 Grade {exam.grade}</span>
                  {exam.due_date && (
                    <span>
                      <Calendar className="w-3 h-3" style={{ display: 'inline', marginRight: 4, verticalAlign: 'middle' }} />
                      Due {new Date(exam.due_date).toLocaleDateString()}
                    </span>
                  )}
                </div>
              </div>

              {/* Status & Score */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 'var(--space-2)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', color: getStatusColor(exam), fontSize: 13, fontWeight: 600 }}>
                  {getStatusIcon(exam)}
                  {getStatusText(exam)}
                </div>
                {exam.my_score !== null && (
                  <div style={{ fontSize: 20, fontWeight: 'bold' }}>
                    {Math.round(exam.my_score)}%
                  </div>
                )}
              </div>

              {/* Actions */}
              <div>
                {!exam.my_submission_id ? (
                  <button
                    className="btn btnPrimary"
                    style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}
                    onClick={() => handleStartExam(exam)}
                  >
                    Start Exam
                  </button>
                ) : (
                  <button
                    className="btn btnSecondary"
                    style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}
                    onClick={() => router.push(`/exam-prep?assignment=${exam.assignment_id}&view=results`)}
                  >
                    View Results
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
