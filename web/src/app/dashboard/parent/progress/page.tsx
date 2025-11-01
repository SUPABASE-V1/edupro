'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useTenantSlug } from '@/lib/tenant/useTenantSlug';
import { ParentShell } from '@/components/dashboard/parent/ParentShell';
import { ArrowLeft, BarChart3, Users } from 'lucide-react';

export default function ProgressPage() {
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
              background: 'linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 24px'
            }}>
              <BarChart3 size={36} color="white" />
            </div>
            
            <h1 className="h1" style={{ marginBottom: 12 }}>Progress Reports</h1>
            <p className="muted" style={{ fontSize: 16, marginBottom: 32 }}>
              Track your children's learning progress and achievements
            </p>

            <div className="card" style={{
              padding: 32,
              background: 'linear-gradient(135deg, rgba(6, 182, 212, 0.05) 0%, rgba(8, 145, 178, 0.05) 100%)',
              border: '1px solid rgba(6, 182, 212, 0.2)',
              textAlign: 'left'
            }}>
              <h3 style={{ marginTop: 0, marginBottom: 16, fontSize: 18 }}>Coming Soon! ??</h3>
              <p style={{ marginBottom: 16, color: 'var(--muted)' }}>
                We're building comprehensive progress tracking that will include:
              </p>
              <ul style={{ marginBottom: 24, color: 'var(--muted)', lineHeight: 1.8 }}>
                <li>?? Subject-wise performance analytics</li>
                <li>?? Learning trajectory over time</li>
                <li>?? Skill mastery indicators</li>
                <li>?? Achievements and milestones</li>
                <li>?? Detailed report cards</li>
              </ul>
              
              <div style={{
                padding: 16,
                background: 'var(--surface-1)',
                borderRadius: 8,
                border: '1px solid var(--border)'
              }}>
                <p style={{ margin: 0, fontSize: 14, color: 'var(--muted)' }}>
                  ?? <strong>Start tracking now:</strong> Add your children to begin collecting progress data as features roll out!
                </p>
              </div>

              <button
                onClick={() => router.push('/dashboard/parent/children')}
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
                <Users size={18} />
                Manage Children
              </button>
            </div>
          </div>
        </div>
      </div>
    </ParentShell>
  );
}
