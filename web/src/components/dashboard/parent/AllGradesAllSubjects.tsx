'use client';

import { BookOpen, GraduationCap } from 'lucide-react';

// Complete CAPS Subject Coverage
const CAPS_SUBJECTS = {
  'Foundation Phase (Grade R-3)': [
    { name: 'Home Language', icon: '??', grades: 'R-3' },
    { name: 'First Additional Language', icon: '??', grades: '1-3' },
    { name: 'Mathematics', icon: '??', grades: 'R-3' },
    { name: 'Life Skills', icon: '??', grades: 'R-3' },
  ],
  'Intermediate Phase (Grade 4-6)': [
    { name: 'Home Language', icon: '??', grades: '4-6' },
    { name: 'First Additional Language', icon: '??', grades: '4-6' },
    { name: 'Mathematics', icon: '??', grades: '4-6' },
    { name: 'Natural Sciences & Technology', icon: '??', grades: '4-6' },
    { name: 'Social Sciences', icon: '??', grades: '4-6' },
  ],
  'Senior Phase (Grade 7-9)': [
    { name: 'Home Language', icon: '??', grades: '7-9' },
    { name: 'First Additional Language', icon: '??', grades: '7-9' },
    { name: 'Mathematics', icon: '??', grades: '7-9' },
    { name: 'Natural Sciences', icon: '??', grades: '7-9' },
    { name: 'Social Sciences', icon: '??', grades: '7-9' },
    { name: 'Technology', icon: '??', grades: '7-9' },
    { name: 'Economic & Management Sciences', icon: '??', grades: '7-9' },
    { name: 'Life Orientation', icon: '??', grades: '7-9' },
    { name: 'Creative Arts', icon: '??', grades: '7-9' },
  ],
  'FET Phase (Grade 10-12)': [
    { name: 'Home Language', icon: '??', grades: '10-12' },
    { name: 'First Additional Language', icon: '??', grades: '10-12' },
    { name: 'Mathematics', icon: '??', grades: '10-12' },
    { name: 'Mathematical Literacy', icon: '??', grades: '10-12' },
    { name: 'Physical Sciences', icon: '??', grades: '10-12' },
    { name: 'Life Sciences', icon: '??', grades: '10-12' },
    { name: 'Accounting', icon: '??', grades: '10-12' },
    { name: 'Business Studies', icon: '??', grades: '10-12' },
    { name: 'Economics', icon: '??', grades: '10-12' },
    { name: 'Geography', icon: '???', grades: '10-12' },
    { name: 'History', icon: '??', grades: '10-12' },
    { name: 'Life Orientation', icon: '??', grades: '10-12' },
    { name: 'Information Technology', icon: '??', grades: '10-12' },
    { name: 'Computer Applications Technology', icon: '???', grades: '10-12' },
  ],
};

interface AllGradesAllSubjectsProps {
  onSelectSubject: (subject: string, grade: string) => void;
}

export function AllGradesAllSubjects({ onSelectSubject }: AllGradesAllSubjectsProps) {
  return (
    <div className="section">
      <div className="sectionTitle">
        <GraduationCap className="icon16" style={{ color: '#8b5cf6' }} />
        Full CAPS Coverage - All Grades & Subjects
      </div>

      <div style={{
        marginBottom: 20,
        padding: 16,
        background: 'rgba(139, 92, 246, 0.1)',
        border: '2px solid #8b5cf6',
        borderRadius: 12
      }}>
        <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 8, color: 'var(--text)' }}>
          ?? Complete CAPS Curriculum Support
        </div>
        <div style={{ fontSize: 13, color: 'var(--muted)', lineHeight: 1.6 }}>
          Click any subject below to get instant AI help, practice tests, revision notes, and exam prep materials aligned with the South African CAPS curriculum.
        </div>
      </div>

      {Object.entries(CAPS_SUBJECTS).map(([phase, subjects]) => (
        <div key={phase} style={{ marginBottom: 24 }}>
          <div style={{
            fontWeight: 700,
            fontSize: 14,
            marginBottom: 12,
            color: 'var(--text)',
            borderBottom: '2px solid var(--border)',
            paddingBottom: 8
          }}>
            {phase}
          </div>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
            gap: 10
          }}>
            {subjects.map(subject => (
              <button
                key={`${phase}-${subject.name}`}
                onClick={() => onSelectSubject(subject.name, subject.grades)}
                className="card"
                style={{
                  padding: '12px 14px',
                  cursor: 'pointer',
                  border: '1px solid var(--border)',
                  background: 'var(--card-bg)',
                  textAlign: 'left',
                  transition: 'all 0.2s',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = '#8b5cf6';
                  e.currentTarget.style.background = 'rgba(139, 92, 246, 0.05)';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'var(--border)';
                  e.currentTarget.style.background = 'var(--card-bg)';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                <span style={{ fontSize: 20 }}>{subject.icon}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 2, color: 'var(--text)' }}>
                    {subject.name}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--muted)' }}>
                    Grades {subject.grades}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      ))}

      {/* Bottom CTA */}
      <div style={{
        marginTop: 24,
        padding: 16,
        background: 'linear-gradient(135deg, #ec4899 0%, #db2777 100%)',
        color: 'white',
        borderRadius: 12,
        textAlign: 'center',
        boxShadow: '0 4px 20px rgba(236, 72, 153, 0.3)'
      }}>
        <div style={{ fontSize: 15, fontWeight: 800, marginBottom: 6 }}>
          ?? Can't Find Your Subject?
        </div>
        <div style={{ fontSize: 13, opacity: 0.95 }}>
          Use Emergency Exam Help above - Our AI tutor supports ALL subjects in ALL 11 official languages!
        </div>
      </div>
    </div>
  );
}
