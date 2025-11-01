'use client';

import { Calendar, Clock, BookOpen } from 'lucide-react';

interface ExamPeriod {
  grade: string;
  subject: string;
  date: string;
  time: string;
  duration: string;
  status: 'upcoming' | 'today' | 'completed';
}

// South African CAPS Exam Schedule (Nov/Dec 2025)
const EXAM_SCHEDULE: ExamPeriod[] = [
  // Grade 12 Finals (Already started)
  { grade: 'Grade 12', subject: 'English Home Language P1', date: 'Nov 1', time: '09:00', duration: '3h', status: 'today' },
  { grade: 'Grade 12', subject: 'English Home Language P2', date: 'Nov 4', time: '14:00', duration: '2.5h', status: 'upcoming' },
  { grade: 'Grade 12', subject: 'Afrikaans Home Language P1', date: 'Nov 1', time: '09:00', duration: '3h', status: 'today' },
  { grade: 'Grade 12', subject: 'Mathematics P1', date: 'Nov 5', time: '09:00', duration: '3h', status: 'upcoming' },
  { grade: 'Grade 12', subject: 'Mathematics P2', date: 'Nov 8', time: '09:00', duration: '3h', status: 'upcoming' },
  { grade: 'Grade 12', subject: 'Physical Sciences P1', date: 'Nov 6', time: '09:00', duration: '3h', status: 'upcoming' },
  { grade: 'Grade 12', subject: 'Physical Sciences P2', date: 'Nov 11', time: '14:00', duration: '3h', status: 'upcoming' },
  { grade: 'Grade 12', subject: 'Life Sciences P1', date: 'Nov 7', time: '09:00', duration: '2.5h', status: 'upcoming' },
  { grade: 'Grade 12', subject: 'Life Sciences P2', date: 'Nov 12', time: '14:00', duration: '2.5h', status: 'upcoming' },
  
  // Grade 11 Finals
  { grade: 'Grade 11', subject: 'English HL P1', date: 'Nov 2', time: '09:00', duration: '2.5h', status: 'upcoming' },
  { grade: 'Grade 11', subject: 'Mathematics P1', date: 'Nov 6', time: '09:00', duration: '3h', status: 'upcoming' },
  { grade: 'Grade 11', subject: 'Physical Sciences P1', date: 'Nov 7', time: '09:00', duration: '3h', status: 'upcoming' },
  { grade: 'Grade 11', subject: 'Life Sciences P1', date: 'Nov 8', time: '09:00', duration: '2.5h', status: 'upcoming' },
  
  // Grade 10 Finals
  { grade: 'Grade 10', subject: 'English HL P1', date: 'Nov 3', time: '09:00', duration: '2h', status: 'upcoming' },
  { grade: 'Grade 10', subject: 'Mathematics P1', date: 'Nov 7', time: '09:00', duration: '2h', status: 'upcoming' },
  { grade: 'Grade 10', subject: 'Natural Sciences', date: 'Nov 8', time: '14:00', duration: '2h', status: 'upcoming' },
  
  // Grade 9 Finals
  { grade: 'Grade 9', subject: 'English HL', date: 'Nov 4', time: '09:00', duration: '2h', status: 'upcoming' },
  { grade: 'Grade 9', subject: 'Mathematics', date: 'Nov 8', time: '09:00', duration: '2h', status: 'upcoming' },
  { grade: 'Grade 9', subject: 'Natural Sciences', date: 'Nov 11', time: '09:00', duration: '1.5h', status: 'upcoming' },
];

interface CAPSExamCalendarProps {
  childGrade?: string;
}

export function CAPSExamCalendar({ childGrade }: CAPSExamCalendarProps) {
  // Filter exams by child's grade if provided
  const relevantExams = childGrade 
    ? EXAM_SCHEDULE.filter(exam => exam.grade === childGrade)
    : EXAM_SCHEDULE.slice(0, 8); // Show first 8 if no grade specified

  const upcomingExams = relevantExams.filter(exam => exam.status === 'upcoming' || exam.status === 'today');
  const todayExams = relevantExams.filter(exam => exam.status === 'today');

  return (
    <div className="section">
      <div className="sectionTitle">
        <Calendar className="icon16" style={{ color: '#ef4444' }} />
        CAPS Exam Schedule {childGrade && `- ${childGrade}`}
      </div>

      {/* TODAY'S EXAMS - CRITICAL */}
      {todayExams.length > 0 && (
        <div style={{
          marginBottom: 16,
          padding: 16,
          background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
          color: 'white',
          borderRadius: 12,
          border: '2px solid #fca5a5'
        }}>
          <div style={{ fontWeight: 800, fontSize: 16, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 24 }}>??</span>
            EXAMS WRITING TODAY
          </div>
          {todayExams.map((exam, idx) => (
            <div key={idx} style={{
              background: 'rgba(255, 255, 255, 0.15)',
              padding: 12,
              borderRadius: 8,
              marginBottom: idx < todayExams.length - 1 ? 8 : 0
            }}>
              <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 4 }}>
                {exam.subject}
              </div>
              <div style={{ fontSize: 13, opacity: 0.95, display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                <span>? {exam.time}</span>
                <span>?? {exam.duration}</span>
                <span>?? {exam.grade}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* UPCOMING EXAMS */}
      <div style={{ display: 'grid', gap: 12 }}>
        {upcomingExams.slice(0, 6).map((exam, idx) => (
          <div key={idx} className="card" style={{
            padding: 12,
            borderLeft: exam.status === 'today' ? '4px solid #ef4444' : '4px solid #3b82f6',
            background: exam.status === 'today' ? 'rgba(239, 68, 68, 0.05)' : 'transparent'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', gap: 12, flexWrap: 'wrap' }}>
              <div style={{ flex: 1, minWidth: 200 }}>
                <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 6, color: 'var(--text)' }}>
                  {exam.subject}
                </div>
                <div style={{ fontSize: 12, color: 'var(--muted)', display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <Calendar size={12} />
                    {exam.date}
                  </span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <Clock size={12} />
                    {exam.time}
                  </span>
                  <span>?? {exam.duration}</span>
                </div>
              </div>
              <div style={{
                background: exam.status === 'today' ? '#ef4444' : '#3b82f6',
                color: 'white',
                padding: '4px 10px',
                borderRadius: 6,
                fontSize: 11,
                fontWeight: 700,
                textTransform: 'uppercase',
                flexShrink: 0
              }}>
                {exam.grade.replace('Grade ', 'G')}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Help CTA */}
      <div style={{
        marginTop: 16,
        padding: 14,
        background: 'rgba(59, 130, 246, 0.1)',
        border: '2px solid #3b82f6',
        borderRadius: 10,
        textAlign: 'center'
      }}>
        <div style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 8 }}>
          <BookOpen size={16} style={{ display: 'inline', marginRight: 6, verticalAlign: 'middle', color: '#3b82f6' }} />
          Need help with any of these subjects?
        </div>
        <div style={{ fontSize: 12, fontWeight: 600, color: '#3b82f6' }}>
          ?? Use Emergency Exam Help below for instant AI tutor support
        </div>
      </div>
    </div>
  );
}
