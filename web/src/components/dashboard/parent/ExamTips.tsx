'use client';

const EXAM_TIPS = [
  { icon: '?', title: 'Start Early', tip: 'Begin studying at least 2 hours before bedtime', color: '#3b82f6' },
  { icon: '??', title: 'Stay Hydrated', tip: 'Drink water regularly while studying', color: '#06b6d4' },
  { icon: '??', title: 'Practice Past Papers', tip: 'Do at least 2-3 full practice exams', color: '#8b5cf6' },
  { icon: '??', title: 'Sleep Well', tip: 'Get 8+ hours sleep the night before', color: '#6366f1' },
  { icon: '??', title: 'Eat Healthy', tip: 'Brain foods: eggs, nuts, fruits, water', color: '#10b981' },
  { icon: '??', title: 'No Distractions', tip: 'Put phone away during study time', color: '#f59e0b' },
];

export function ExamTips() {
  return (
    <div className="section">
      <div className="sectionTitle">
        <span style={{ fontSize: 16 }}>??</span>
        Last-Minute Exam Tips
      </div>
      <div style={{ display: 'grid', gap: 12 }}>
        {EXAM_TIPS.map(tip => (
          <div 
            key={tip.title} 
            className="card" 
            style={{ 
              padding: 12, 
              display: 'flex', 
              gap: 12,
              borderLeft: `3px solid ${tip.color}`,
              background: `${tip.color}08`
            }}
          >
            <span style={{ fontSize: 24, flexShrink: 0 }}>{tip.icon}</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 600, marginBottom: 4, fontSize: 14 }}>{tip.title}</div>
              <div style={{ fontSize: 13, color: 'var(--muted)', lineHeight: 1.5 }}>{tip.tip}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
