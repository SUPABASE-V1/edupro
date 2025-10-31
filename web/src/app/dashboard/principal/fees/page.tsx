'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useUserProfile } from '@/lib/hooks/useUserProfile';
import { PrincipalShell } from '@/components/dashboard/principal/PrincipalShell';
import { Plus, Edit, Trash2, DollarSign, Users, TrendingUp, AlertCircle, ArrowLeft, Calendar } from 'lucide-react';

interface FeeStructure {
  id: string;
  name: string;
  description: string;
  age_group: string;
  amount_cents: number;
  billing_frequency: string;
  fee_category: string;
  is_active: boolean;
  is_optional: boolean;
  sibling_discount_percent: number;
}

export default function PrincipalFeesPage() {
  const router = useRouter();
  const supabase = createClient();
  const [userId, setUserId] = useState<string>();
  const [fees, setFees] = useState<FeeStructure[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [summary, setSummary] = useState<any>(null);

  const { profile } = useUserProfile(userId);
  const preschoolId = profile?.preschoolId;
  const preschoolName = profile?.preschoolName;

  useEffect(() => {
    const initAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push('/sign-in');
        return;
      }
      setUserId(session.user.id);
      setLoading(false);
    };
    initAuth();
  }, [router, supabase]);

  useEffect(() => {
    if (preschoolId) {
      loadFees();
      loadSummary();
    }
  }, [preschoolId]);

  const loadFees = async () => {
    if (!preschoolId) return;
    
    try {
      const { data, error } = await supabase
        .from('school_fee_structures')
        .select('*')
        .eq('preschool_id', preschoolId)
        .order('age_group', { ascending: true });

      if (error) throw error;
      setFees(data || []);
    } catch (error) {
      console.error('Error loading fees:', error);
    }
  };

  const loadSummary = async () => {
    if (!preschoolId) return;
    
    try {
      const { data, error } = await supabase
        .rpc('get_school_fee_summary', { p_preschool_id: preschoolId });

      if (error) throw error;
      setSummary(data);
    } catch (error) {
      console.error('Error loading summary:', error);
    }
  };

  const handleCreateDefaults = async () => {
    if (!preschoolId) return;
    
    if (!confirm('Create default fee structures? This will add 4 standard fees (you can edit them after).')) return;
    
    try {
      const { data, error } = await supabase
        .rpc('create_default_fee_structures', { p_preschool_id: preschoolId });

      if (error) throw error;
      
      alert(`✅ Created ${data} default fee structures!`);
      loadFees();
    } catch (error) {
      console.error('Error creating defaults:', error);
      alert('Failed to create default fees');
    }
  };

  const handleDeleteFee = async (feeId: string) => {
    if (!confirm('Delete this fee structure? This will NOT affect existing assignments.')) return;
    
    try {
      const { error } = await supabase
        .from('school_fee_structures')
        .delete()
        .eq('id', feeId);

      if (error) throw error;
      
      setFees(fees.filter(f => f.id !== feeId));
      alert('✅ Fee structure deleted');
    } catch (error) {
      console.error('Error deleting fee:', error);
      alert('Failed to delete fee structure');
    }
  };

  const formatAmount = (cents: number) => {
    return `R${(cents / 100).toFixed(2)}`;
  };

  if (loading || !userId) {
    return (
      <PrincipalShell preschoolName={preschoolName} preschoolId={preschoolId}>
        <div style={{ textAlign: 'center', padding: 'var(--space-8)' }}>
          <div className="spinner" />
        </div>
      </PrincipalShell>
    );
  }

  return (
    <PrincipalShell preschoolName={preschoolName} preschoolId={preschoolId}>
      <div style={{ padding: 'var(--space-4)', maxWidth: '1200px', margin: '0 auto' }}>
        {/* Back Button & Header */}
        <div style={{ marginBottom: 'var(--space-6)' }}>
          <button 
            onClick={() => router.back()}
            className="btn btnSecondary"
            style={{ 
              display: 'inline-flex', 
              alignItems: 'center', 
              gap: 'var(--space-2)',
              marginBottom: 'var(--space-4)',
              padding: '8px 12px',
              fontSize: 14
            }}
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>
          <h1 style={{ fontSize: 32, fontWeight: 'bold', marginBottom: 'var(--space-2)' }}>
            💰 Fee Management
          </h1>
          <p className="muted" style={{ fontSize: 14 }}>
            Configure fee structures for your school
          </p>
        </div>

        {/* Summary Cards */}
        {summary && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--space-4)', marginBottom: 'var(--space-6)' }}>
            <div className="card" style={{ padding: 'var(--space-4)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-2)' }}>
                <TrendingUp className="w-5 h-5" style={{ color: 'var(--success)' }} />
                <span className="muted" style={{ fontSize: 13 }}>Collected</span>
              </div>
              <div style={{ fontSize: 24, fontWeight: 'bold' }}>
                {formatAmount(summary.total_collected_cents || 0)}
              </div>
            </div>

            <div className="card" style={{ padding: 'var(--space-4)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-2)' }}>
                <AlertCircle className="w-5 h-5" style={{ color: 'var(--warning)' }} />
                <span className="muted" style={{ fontSize: 13 }}>Outstanding</span>
              </div>
              <div style={{ fontSize: 24, fontWeight: 'bold' }}>
                {formatAmount(summary.outstanding_balance_cents || 0)}
              </div>
            </div>

            <div className="card" style={{ padding: 'var(--space-4)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-2)' }}>
                <Users className="w-5 h-5" style={{ color: 'var(--primary)' }} />
                <span className="muted" style={{ fontSize: 13 }}>Students</span>
              </div>
              <div style={{ fontSize: 24, fontWeight: 'bold' }}>
                {summary.total_students || 0}
              </div>
            </div>

            <div className="card" style={{ padding: 'var(--space-4)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-2)' }}>
                <TrendingDown className="w-5 h-5" style={{ color: 'var(--danger)' }} />
                <span className="muted" style={{ fontSize: 13 }}>Overdue</span>
              </div>
              <div style={{ fontSize: 24, fontWeight: 'bold' }}>
                {summary.overdue_count || 0}
              </div>
            </div>
          </div>
        )}

        {/* Actions Bar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-4)' }}>
          <h2 style={{ fontSize: 20, fontWeight: 600 }}>Fee Structures</h2>
          <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
            {fees.length === 0 && (
              <button 
                className="btn btnSecondary"
                onClick={handleCreateDefaults}
                style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}
              >
                <Plus className="w-4 h-4" />
                Create Defaults
              </button>
            )}
            <button 
              className="btn btnPrimary"
              onClick={() => setShowCreateModal(true)}
              style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}
            >
              <Plus className="w-4 h-4" />
              Add Fee
            </button>
          </div>
        </div>

        {/* Fee List */}
        {fees.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: 'var(--space-8)', border: '1px dashed var(--border)' }}>
            <DollarSign className="w-12 h-12" style={{ color: 'var(--text-muted)', margin: '0 auto var(--space-4)' }} />
            <h3 style={{ fontSize: 18, fontWeight: 600, marginBottom: 'var(--space-2)' }}>
              No Fee Structures Yet
            </h3>
            <p className="muted" style={{ marginBottom: 'var(--space-4)' }}>
              Set up your school's fee structure to enable parent payments
            </p>
            <button 
              className="btn btnPrimary"
              onClick={handleCreateDefaults}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 'var(--space-2)' }}
            >
              <Plus className="w-4 h-4" />
              Create Default Fee Structure
            </button>
          </div>
        ) : (
          <div style={{ display: 'grid', gap: 'var(--space-4)' }}>
            {fees.map((fee) => (
              <div
                key={fee.id}
                className="card"
                style={{
                  padding: 'var(--space-4)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 'var(--space-4)',
                  border: '1px solid var(--border)',
                  opacity: fee.is_active ? 1 : 0.5
                }}
              >
                <div style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: 'var(--radius-2)',
                  background: 'var(--success)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}>
                  <DollarSign className="w-6 h-6" style={{ color: '#fff' }} />
                </div>

                <div style={{ flex: 1 }}>
                  <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 4 }}>
                    {fee.name}
                    {!fee.is_active && <span style={{ color: 'var(--warning)', fontSize: 12, marginLeft: 8 }}>(Inactive)</span>}
                    {fee.is_optional && <span style={{ color: 'var(--primary)', fontSize: 12, marginLeft: 8 }}>(Optional)</span>}
                  </h3>
                  <div style={{ display: 'flex', gap: 'var(--space-4)', fontSize: 13, flexWrap: 'wrap' }} className="muted">
                    <span>💰 {formatAmount(fee.amount_cents)}</span>
                    <span>📅 {fee.billing_frequency}</span>
                    {fee.age_group && <span>👶 Ages: {fee.age_group}</span>}
                    <span>📂 {fee.fee_category}</span>
                    {fee.sibling_discount_percent > 0 && (
                      <span>👨‍👩‍👧 {fee.sibling_discount_percent}% sibling discount</span>
                    )}
                  </div>
                  {fee.description && (
                    <p className="muted" style={{ fontSize: 12, marginTop: 4 }}>
                      {fee.description}
                    </p>
                  )}
                </div>

                <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                  <button
                    className="btn btnSecondary"
                    style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', fontSize: 13 }}
                    onClick={() => alert('Edit fee feature coming soon!')}
                  >
                    <Edit className="w-4 h-4" />
                    Edit
                  </button>
                  <button
                    className="btn"
                    style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', fontSize: 13, background: 'var(--danger)', color: '#fff' }}
                    onClick={() => handleDeleteFee(fee.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Info Box */}
        <div className="card" style={{ padding: 'var(--space-4)', marginTop: 'var(--space-6)', background: 'rgba(99, 102, 241, 0.1)', border: '1px solid rgba(99, 102, 241, 0.3)' }}>
          <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 'var(--space-2)', display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
            <Calendar className="w-5 h-5" style={{ color: 'var(--primary)' }} />
            How Fee Management Works
          </h3>
          <ul style={{ fontSize: 14, lineHeight: 1.6 }} className="muted">
            <li>✅ Create fee structures for different age groups or grades</li>
            <li>✅ Fees automatically assign to students based on their age group</li>
            <li>✅ Parents see their child's fees in their dashboard</li>
            <li>✅ Parents can pay via PayFast (instant processing)</li>
            <li>✅ Track payments, outstanding balances, and overdue fees</li>
            <li>✅ Set sibling discounts and early bird discounts</li>
          </ul>
        </div>
      </div>

      {/* Create Fee Modal - Placeholder */}
      {showCreateModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.7)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div className="card" style={{
            width: '90%',
            maxWidth: '600px',
            padding: 'var(--space-6)',
            maxHeight: '90vh',
            overflow: 'auto'
          }}>
            <h2 style={{ fontSize: 20, fontWeight: 'bold', marginBottom: 'var(--space-4)' }}>
              Create Fee Structure
            </h2>
            
            <p className="muted" style={{ marginBottom: 'var(--space-4)' }}>
              This feature is being built. For now, use "Create Defaults" to generate standard fee structures.
            </p>
            
            <button
              className="btn btnSecondary"
              onClick={() => setShowCreateModal(false)}
              style={{ width: '100%' }}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </PrincipalShell>
  );
}
