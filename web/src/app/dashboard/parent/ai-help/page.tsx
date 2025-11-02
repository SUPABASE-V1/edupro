'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useTenantSlug } from '@/lib/tenant/useTenantSlug';
import { ParentShell } from '@/components/dashboard/parent/ParentShell';
import { ArrowLeft, Sparkles, MessageCircle, Brain } from 'lucide-react';

export default function AIHelpPage() {
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
              background: 'linear-gradient(135deg, #ec4899 0%, #db2777 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 24px'
            }}>
              <Sparkles size={36} color="white" />
            </div>
            
            <h1 className="h1" style={{ marginBottom: 12 }}>AI Help & Tutoring</h1>
            <p className="muted" style={{ fontSize: 16, marginBottom: 32 }}>
              Get instant homework help and explanations from our AI tutor
            </p>

            <div className="card" style={{
              padding: 32,
              background: 'linear-gradient(135deg, rgba(236, 72, 153, 0.05) 0%, rgba(219, 39, 119, 0.05) 100%)',
              border: '1px solid rgba(236, 72, 153, 0.2)',
              textAlign: 'left'
            }}>
                            <h3 style={{ marginTop: 0, marginBottom: 16, fontSize: 18 }}>AI Tutor Features 🤖</h3>
              <p style={{ color: 'var(--muted)', marginBottom: 20, lineHeight: 1.6 }}>
                Get instant help with homework and studying:
              </p>
              <ul style={{ marginLeft: 20, marginBottom: 20, lineHeight: 1.8 }}>
                <li>💬 Natural conversation interface</li>
                <li>📚 Subject-specific explanations</li>
                <li>🔢 Step-by-step problem solving</li>
                <li>🎙️ Voice interaction support</li>
                <li>🌍 Multi-language support</li>
                <li>✅ Homework checking and feedback</li>
              </ul>

              <div style={{
                padding: 16,
                background: 'rgba(16, 185, 129, 0.1)',
                borderRadius: 8,
                border: '1px solid rgba(16, 185, 129, 0.3)',
                marginBottom: 16
              }}>
                <div style={{ display: 'flex', alignItems: 'start', gap: 12 }}>
                  <Brain size={20} style={{ marginTop: 2, flexShrink: 0, color: '#10b981' }} />
                  <div>
                    <p style={{ margin: 0, fontSize: 14, fontWeight: 600, marginBottom: 4 }}>
                      ✨ Basic AI Help Available Now!
                    </p>
                    <p style={{ margin: 0, fontSize: 14, color: 'var(--muted)' }}>
                      Try asking questions on the dashboard - look for the AI helper widget!
                    </p>
                  </div>
                </div>
              </div>
              
              <div style={{
                padding: 16,
                background: 'var(--surface-1)',
                borderRadius: 8,
                border: '1px solid var(--border)'
              }}>
                <p style={{ margin: 0, fontSize: 14, color: 'var(--muted)' }}>
                  💡 <strong>Coming soon:</strong> Dedicated AI tutor chat with conversation history, voice input, and personalized learning recommendations!
                </p>
              </div>

              <button
                onClick={() => router.push('/dashboard/parent')}
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
                Try AI Help on Dashboard
              </button>
            </div>
          </div>
        </div>
      </div>
    </ParentShell>
  );
}
