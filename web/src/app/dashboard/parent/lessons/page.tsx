'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useTenantSlug } from '@/lib/tenant/useTenantSlug';
import { ParentShell } from '@/components/dashboard/parent/ParentShell';
import { ArrowLeft, BookOpen, Sparkles } from 'lucide-react';

export default function LessonsPage() {
  const router = useRouter();
  const supabase = createClient();
  const [email, setEmail] = useState<string>('');
  const [userId, setUserId] = useState<string>();
  const { slug } = useTenantSlug(userId);

  useEffect(() => {
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { router.push('/sign-in'); return; }
      setEmail(session.user.email || '');
      setUserId(session.user.id);
    })();
  }, [router, supabase.auth]);

  return (
    <ParentShell tenantSlug={slug} userEmail={email}>
      <div className="container" style={{ maxWidth: 800 }}>
        {/* Back Button */}
        <button
          onClick={() => router.push('/dashboard/parent')}
          className="btn"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            marginBottom: 24,
            background: 'var(--surface-1)',
            border: '1px solid var(--border)',
            color: 'var(--text)',
            padding: '8px 16px',
            borderRadius: 8,
            cursor: 'pointer',
            fontSize: 14,
            fontWeight: 500
          }}
        >
          <ArrowLeft size={16} />
          Back to Dashboard
        </button>

        <div className="section">
          <div style={{ textAlign: 'center', padding: '60px 20px' }}>
            <div style={{
              width: 80,
              height: 80,
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 24px'
            }}>
              <BookOpen size={36} color="white" />
            </div>
            
            <h1 className="h1" style={{ marginBottom: 12 }}>Lessons Library</h1>
            <p className="muted" style={{ fontSize: 16, marginBottom: 32 }}>
              Interactive lessons aligned with the CAPS curriculum
            </p>

            <div className="card" style={{
              padding: 32,
              background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.05) 0%, rgba(5, 150, 105, 0.05) 100%)',
              border: '1px solid rgba(16, 185, 129, 0.2)',
              textAlign: 'left'
            }}>
                            <h3 style={{ marginTop: 0, marginBottom: 16, fontSize: 18 }}>Coming Soon! 📚</h3>
              <p style={{ color: 'var(--muted)', marginBottom: 16, fontSize: 14 }}>
                We're building an incredible lesson library for you. Here's what's coming:
              </p>
              <ul style={{ color: 'var(--muted)', marginLeft: 20, fontSize: 14, lineHeight: 1.8 }}>
                <li>✅ CAPS-aligned curriculum for all grades</li>
                <li>🎥 Video lessons with interactive elements</li>
                <li>✍️ Practice exercises and quizzes</li>
                <li>📊 Progress tracking per subject</li>
              </ul>
              
              <div style={{
                padding: 16,
                background: 'var(--surface-1)',
                borderRadius: 8,
                border: '1px solid var(--border)'
              }}>
                <p style={{ margin: 0, fontSize: 14, color: 'var(--muted)' }}>
                  💡 <strong>In the meantime:</strong> Try our AI Help feature to get instant homework assistance and explanations!
                </p>
              </div>

              <button
                onClick={() => router.push('/dashboard/parent/ai-help')}
                className="btn btnPrimary"
                style={{
                  marginTop: 24,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '12px 24px',
                  fontSize: 15,
                  fontWeight: 600
                }}
              >
                <Sparkles size={18} />
                Try AI Help
              </button>
            </div>
          </div>
        </div>
      </div>
    </ParentShell>
  );
}
