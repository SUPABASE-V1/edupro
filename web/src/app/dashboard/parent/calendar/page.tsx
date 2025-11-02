'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useTenantSlug } from '@/lib/tenant/useTenantSlug';
import { ParentShell } from '@/components/dashboard/parent/ParentShell';
import { ArrowLeft, Calendar as CalendarIcon, MessageCircle } from 'lucide-react';

export default function CalendarPage() {
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
              <CalendarIcon size={36} color="white" />
            </div>
            
            <h1 className="h1" style={{ marginBottom: 12 }}>School Calendar</h1>
            <p className="muted" style={{ fontSize: 16, marginBottom: 32 }}>
              View school events, holidays, and important dates
            </p>

            <div className="card" style={{
              padding: 32,
              background: 'linear-gradient(135deg, rgba(6, 182, 212, 0.05) 0%, rgba(8, 145, 178, 0.05) 100%)',
              border: '1px solid rgba(6, 182, 212, 0.2)',
              textAlign: 'left'
            }}>
                            <h3 style={{ marginTop: 0, marginBottom: 16, fontSize: 18 }}>Coming Soon! 📅</h3>
              <p style={{ color: 'var(--muted)', marginBottom: 20, lineHeight: 1.6 }}>
                Stay organized with a comprehensive school calendar featuring:
              </p>
              <ul style={{ marginLeft: 20, marginBottom: 20, lineHeight: 1.8 }}>
                <li>🎓 School events and activities</li>
                <li>📆 Term dates and holidays</li>
                <li>📝 Exam and assessment schedules</li>
                <li>🎉 Special days and celebrations</li>
                <li>🔔 Event reminders and notifications</li>
                <li>🔄 Sync with your personal calendar</li>
              </ul>
              
              <div style={{
                padding: 16,
                background: 'var(--surface-1)',
                borderRadius: 8,
                border: '1px solid var(--border)'
              }}>
                <p style={{ margin: 0, fontSize: 14, color: 'var(--muted)' }}>
                  💡 <strong>Stay connected:</strong> Check the messages section for important announcements from your school!
                </p>
              </div>

              <button
                onClick={() => router.push('/dashboard/parent/messages')}
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
                <MessageCircle size={18} />
                View Messages
              </button>
            </div>
          </div>
        </div>
      </div>
    </ParentShell>
  );
}
