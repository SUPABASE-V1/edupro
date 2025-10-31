'use client';

import { useState, useEffect } from 'react';
import { Plus, FileText, Users, Calendar, Download, Eye, Trash2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { ExamPrepWidget } from '@/components/dashboard/exam-prep/ExamPrepWidget';

interface Exam {
  id: string;
  title: string;
  grade: string;
  subject: string;
  duration: number;
  created_at: string;
  status: string;
}

export default function TeacherExamsPage() {
  const [exams, setExams] = useState<Exam[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [selectedTab, setSelectedTab] = useState<'my-exams' | 'create-new'>('my-exams');
  const [viewingExam, setViewingExam] = useState<string | null>(null);
  const [assigningExam, setAssigningExam] = useState<Exam | null>(null);

  useEffect(() => {
    loadExams();
  }, []);

  const loadExams = async () => {
    setLoading(true);
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) return;

      const { data, error } = await supabase
        .from('exam_generations')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);

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

  const handleDeleteExam = async (examId: string) => {
    if (!confirm('Are you sure you want to delete this exam?')) return;

    try {
      const supabase = createClient();
      const { error } = await supabase
        .from('exam_generations')
        .delete()
        .eq('id', examId);

      if (error) {
        alert('Failed to delete exam: ' + error.message);
      } else {
        setExams(exams.filter(e => e.id !== examId));
      }
    } catch (err) {
      alert('Error deleting exam');
      console.error(err);
    }
  };

  const handleCreateExam = (prompt: string, display: string) => {
    console.log('Creating exam:', { prompt, display });
    setShowCreate(false);
    setTimeout(loadExams, 2000); // Reload after generation
  };

  const handleViewExam = (examId: string) => {
    // Navigate to exam view page
    window.location.href = `/exam-prep?id=${examId}`;
  };

  const handleAssignExam = (exam: Exam) => {
    setAssigningExam(exam);
  };

  const handleDownloadPDF = async (exam: Exam) => {
    alert('📄 PDF export coming soon!\n\nThis will generate a downloadable PDF of the exam.');
  };

  return (
    <>
      {/* Assignment Modal */}
      {assigningExam && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div className="card" style={{
            width: '90%',
            maxWidth: '500px',
            padding: 'var(--space-6)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-2)',
            background: 'var(--surface)'
          }}>
            <h2 style={{ fontSize: 20, fontWeight: 'bold', marginBottom: 'var(--space-4)' }}>
              📤 Assign Exam
            </h2>
            <div style={{ marginBottom: 'var(--space-4)' }}>
              <p style={{ fontSize: 16, marginBottom: 'var(--space-2)' }}>
                <strong>{assigningExam.title || `${assigningExam.grade} ${assigningExam.subject}`}</strong>
              </p>
              <p className="muted" style={{ fontSize: 14 }}>
                Duration: {assigningExam.duration || 60} minutes
              </p>
            </div>
            
            <div style={{ marginBottom: 'var(--space-4)' }}>
              <label style={{ display: 'block', fontWeight: 600, marginBottom: 'var(--space-2)', fontSize: 14 }}>
                Select Class or Students
              </label>
              <select className="input" style={{ width: '100%' }}>
                <option value="">Choose a class...</option>
                <option value="grade-9a">Grade 9A (24 students)</option>
                <option value="grade-9b">Grade 9B (22 students)</option>
                <option value="all">All My Students</option>
              </select>
            </div>

            <div style={{ marginBottom: 'var(--space-4)' }}>
              <label style={{ display: 'block', fontWeight: 600, marginBottom: 'var(--space-2)', fontSize: 14 }}>
                Due Date
              </label>
              <input 
                type="datetime-local" 
                className="input" 
                style={{ width: '100%' }}
                defaultValue={new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 16)}
              />
            </div>

            <div style={{ display: 'flex', gap: 'var(--space-2)', justifyContent: 'flex-end' }}>
              <button
                className="btn btnSecondary"
                onClick={() => setAssigningExam(null)}
              >
                Cancel
              </button>
              <button
                className="btn btnPrimary"
                onClick={() => {
                  alert('✅ Assignment feature coming soon!\n\nThis will:\n• Notify selected students\n• Track completion\n• Show results dashboard');
                  setAssigningExam(null);
                }}
              >
                Assign Exam
              </button>
            </div>
          </div>
        </div>
      )}

      <div style={{ padding: 'var(--space-4)', maxWidth: '1200px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ marginBottom: 'var(--space-6)' }}>
          <h1 style={{ fontSize: 32, fontWeight: 'bold', marginBottom: 'var(--space-2)' }}>
            📝 My Exams
          </h1>
          <p className="muted" style={{ fontSize: 14 }}>
            Create, manage, and assign exams to your students
          </p>
        </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 'var(--space-2)', marginBottom: 'var(--space-4)', borderBottom: '1px solid var(--border)' }}>
        <button
          onClick={() => setSelectedTab('my-exams')}
          style={{
            padding: 'var(--space-3)',
            background: 'none',
            border: 'none',
            borderBottom: selectedTab === 'my-exams' ? '2px solid var(--primary)' : '2px solid transparent',
            color: selectedTab === 'my-exams' ? 'var(--primary)' : 'var(--text-muted)',
            fontWeight: selectedTab === 'my-exams' ? 600 : 400,
            cursor: 'pointer',
            fontSize: 14
          }}
        >
          <FileText className="w-4 h-4" style={{ display: 'inline', marginRight: 6, verticalAlign: 'middle' }} />
          My Exams ({exams.length})
        </button>
        <button
          onClick={() => setSelectedTab('create-new')}
          style={{
            padding: 'var(--space-3)',
            background: 'none',
            border: 'none',
            borderBottom: selectedTab === 'create-new' ? '2px solid var(--primary)' : '2px solid transparent',
            color: selectedTab === 'create-new' ? 'var(--primary)' : 'var(--text-muted)',
            fontWeight: selectedTab === 'create-new' ? 600 : 400,
            cursor: 'pointer',
            fontSize: 14
          }}
        >
          <Plus className="w-4 h-4" style={{ display: 'inline', marginRight: 6, verticalAlign: 'middle' }} />
          Create New
        </button>
      </div>

      {/* Tab Content */}
      {selectedTab === 'my-exams' ? (
        <div>
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
                No exams yet
              </h3>
              <p className="muted" style={{ marginBottom: 'var(--space-4)' }}>
                Create your first exam to get started
              </p>
              <button
                className="btn btnPrimary"
                onClick={() => setSelectedTab('create-new')}
                style={{ display: 'inline-flex', alignItems: 'center', gap: 'var(--space-2)' }}
              >
                <Plus className="w-4 h-4" />
                Create Exam
              </button>
            </div>
          ) : (
            <div style={{ display: 'grid', gap: 'var(--space-4)' }}>
              {exams.map((exam) => (
                <div
                  key={exam.id}
                  className="card"
                  style={{
                    padding: 'var(--space-4)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 'var(--space-4)',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius-2)'
                  }}
                >
                  {/* Icon */}
                  <div style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: 'var(--radius-2)',
                    background: 'var(--primary)',
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
                      {exam.title || `${exam.grade} ${exam.subject} Exam`}
                    </h3>
                    <div style={{ display: 'flex', gap: 'var(--space-4)', fontSize: 13 }} className="muted">
                      <span>📚 {exam.subject}</span>
                      <span>🎓 Grade {exam.grade}</span>
                      <span>⏱️ {exam.duration || 60} min</span>
                      <span>📅 {new Date(exam.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                    <button
                      className="btn btnPrimary"
                      style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', fontSize: 13 }}
                      onClick={() => handleAssignExam(exam)}
                      title="Assign to students"
                    >
                      <Users className="w-4 h-4" />
                      Assign
                    </button>
                    <button
                      className="btn btnSecondary"
                      style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', fontSize: 13 }}
                      onClick={() => handleViewExam(exam.id)}
                      title="View exam"
                    >
                      <Eye className="w-4 h-4" />
                      View
                    </button>
                    <button
                      className="btn btnSecondary"
                      style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', fontSize: 13 }}
                      onClick={() => handleDownloadPDF(exam)}
                      title="Download PDF"
                    >
                      <Download className="w-4 h-4" />
                      PDF
                    </button>
                    <button
                      className="btn"
                      style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', fontSize: 13, background: 'var(--danger)', color: '#fff' }}
                      onClick={() => handleDeleteExam(exam.id)}
                      title="Delete exam"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="card" style={{ padding: 'var(--space-6)', border: '1px solid var(--border)', borderRadius: 'var(--radius-2)' }}>
          <h2 style={{ fontSize: 20, fontWeight: 'bold', marginBottom: 'var(--space-4)' }}>
            Create New Exam
          </h2>
          <ExamPrepWidget
            onAskDashAI={handleCreateExam}
            guestMode={false}
          />
        </div>
      )}
      </div>
    </>
  );
}
