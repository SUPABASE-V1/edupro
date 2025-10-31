'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useUserProfile } from '@/lib/hooks/useUserProfile';
import { PrincipalShell } from '@/components/dashboard/principal/PrincipalShell';
import { 
  Plus, FileText, Eye, Download, Send, Trash2, 
  DollarSign, AlertCircle, Clock, CheckCircle, ArrowLeft,
  Edit, Calendar, User
} from 'lucide-react';

interface Invoice {
  id: string;
  invoice_number: string;
  invoice_type: 'automated' | 'manual';
  invoice_date: string;
  due_date: string;
  student_name: string;
  bill_to_name: string;
  total_cents: number;
  paid_cents: number;
  balance_cents: number;
  status: string;
}

export default function PrincipalInvoicesPage() {
  const router = useRouter();
  const supabase = createClient();
  const [userId, setUserId] = useState<string>();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedTab, setSelectedTab] = useState<'all' | 'outstanding' | 'overdue' | 'paid'>('all');
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
      loadInvoices();
      loadSummary();
    }
  }, [preschoolId, selectedTab]);

  const loadInvoices = async () => {
    if (!preschoolId) return;
    
    try {
      let query = supabase
        .from('invoices')
        .select('*')
        .eq('preschool_id', preschoolId)
        .order('invoice_date', { ascending: false });

      // Apply tab filters
      if (selectedTab === 'outstanding') {
        query = query.in('status', ['sent', 'viewed', 'partial']);
      } else if (selectedTab === 'overdue') {
        query = query.eq('status', 'overdue');
      } else if (selectedTab === 'paid') {
        query = query.eq('status', 'paid');
      }

      const { data, error } = await query;

      if (error) throw error;
      setInvoices(data || []);
    } catch (error) {
      console.error('Error loading invoices:', error);
    }
  };

  const loadSummary = async () => {
    if (!preschoolId) return;
    
    try {
      const { data, error } = await supabase
        .rpc('get_school_invoice_summary', { p_preschool_id: preschoolId });

      if (error) throw error;
      setSummary(data);
    } catch (error) {
      console.error('Error loading summary:', error);
    }
  };

  const handleDeleteInvoice = async (invoiceId: string) => {
    if (!confirm('Delete this invoice? This action cannot be undone.')) return;
    
    try {
      const { error } = await supabase
        .from('invoices')
        .delete()
        .eq('id', invoiceId);

      if (error) throw error;
      
      setInvoices(invoices.filter(i => i.id !== invoiceId));
      alert('✅ Invoice deleted');
      loadSummary();
    } catch (error) {
      console.error('Error deleting invoice:', error);
      alert('Failed to delete invoice');
    }
  };

  const handleViewInvoice = (invoiceId: string) => {
    router.push(`/dashboard/principal/invoices/${invoiceId}`);
  };

  const handleDownloadPDF = async (invoiceId: string) => {
    try {
      const response = await fetch(`/api/invoices/${invoiceId}/pdf`);
      if (!response.ok) throw new Error('Failed to generate PDF');
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `invoice-${invoiceId}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error downloading PDF:', error);
      alert('Failed to download invoice PDF');
    }
  };

  const handleSendInvoice = async (invoiceId: string) => {
    if (!confirm('Send this invoice to the parent via email?')) return;
    
    try {
      const response = await fetch(`/api/invoices/${invoiceId}/send`, {
        method: 'POST',
      });
      
      if (!response.ok) throw new Error('Failed to send invoice');
      
      alert('✅ Invoice sent successfully!');
      loadInvoices();
    } catch (error) {
      console.error('Error sending invoice:', error);
      alert('Failed to send invoice');
    }
  };

  const formatAmount = (cents: number) => {
    return `R${(cents / 100).toFixed(2)}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-ZA', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, any> = {
      draft: { bg: 'rgba(156, 163, 175, 0.1)', color: '#6b7280', icon: Clock },
      sent: { bg: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6', icon: Send },
      viewed: { bg: 'rgba(139, 92, 246, 0.1)', color: '#8b5cf6', icon: Eye },
      partial: { bg: 'rgba(251, 191, 36, 0.1)', color: '#fbbf24', icon: DollarSign },
      paid: { bg: 'rgba(34, 197, 94, 0.1)', color: '#22c55e', icon: CheckCircle },
      overdue: { bg: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', icon: AlertCircle },
      cancelled: { bg: 'rgba(107, 114, 128, 0.1)', color: '#6b7280', icon: Trash2 },
    };

    const style = styles[status] || styles.draft;
    const Icon = style.icon;

    return (
      <span style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '4px',
        padding: '4px 10px',
        background: style.bg,
        color: style.color,
        borderRadius: '6px',
        fontSize: '12px',
        fontWeight: 600,
      }}>
        <Icon className="w-3 h-3" />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
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
      <div style={{ padding: 'var(--space-4)', maxWidth: '1400px', margin: '0 auto' }}>
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
            📄 Invoice Management
          </h1>
          <p className="muted" style={{ fontSize: 14 }}>
            Create, send, and track professional invoices for your school
          </p>
        </div>

        {/* Summary Cards */}
        {summary && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--space-4)', marginBottom: 'var(--space-6)' }}>
            <div className="card" style={{ padding: 'var(--space-4)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-2)' }}>
                <FileText className="w-5 h-5" style={{ color: 'var(--primary)' }} />
                <span className="muted" style={{ fontSize: 13 }}>Total Invoices</span>
              </div>
              <div style={{ fontSize: 24, fontWeight: 'bold' }}>
                {summary.total_invoices || 0}
              </div>
            </div>

            <div className="card" style={{ padding: 'var(--space-4)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-2)' }}>
                <DollarSign className="w-5 h-5" style={{ color: 'var(--success)' }} />
                <span className="muted" style={{ fontSize: 13 }}>Invoiced</span>
              </div>
              <div style={{ fontSize: 24, fontWeight: 'bold' }}>
                {formatAmount(summary.total_invoiced_cents || 0)}
              </div>
            </div>

            <div className="card" style={{ padding: 'var(--space-4)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-2)' }}>
                <CheckCircle className="w-5 h-5" style={{ color: 'var(--success)' }} />
                <span className="muted" style={{ fontSize: 13 }}>Collected</span>
              </div>
              <div style={{ fontSize: 24, fontWeight: 'bold', color: 'var(--success)' }}>
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
                <Clock className="w-5 h-5" style={{ color: 'var(--danger)' }} />
                <span className="muted" style={{ fontSize: 13 }}>Overdue</span>
              </div>
              <div style={{ fontSize: 24, fontWeight: 'bold', color: 'var(--danger)' }}>
                {summary.overdue_count || 0}
              </div>
              <p className="muted" style={{ fontSize: 12, marginTop: 4 }}>
                {formatAmount(summary.overdue_amount_cents || 0)}
              </p>
            </div>
          </div>
        )}

        {/* Actions Bar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-4)', flexWrap: 'wrap', gap: 'var(--space-3)' }}>
          {/* Tabs */}
          <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
            {[
              { id: 'all', label: 'All Invoices' },
              { id: 'outstanding', label: 'Outstanding' },
              { id: 'overdue', label: 'Overdue' },
              { id: 'paid', label: 'Paid' },
            ].map((tab) => (
              <button
                key={tab.id}
                className={selectedTab === tab.id ? 'btn btnPrimary' : 'btn btnSecondary'}
                onClick={() => setSelectedTab(tab.id as any)}
                style={{ fontSize: 14 }}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Create Invoice Button */}
          <button 
            className="btn btnPrimary"
            onClick={() => setShowCreateModal(true)}
            style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}
          >
            <Plus className="w-4 h-4" />
            Create Manual Invoice
          </button>
        </div>

        {/* Invoice List */}
        {invoices.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: 'var(--space-8)', border: '1px dashed var(--border)' }}>
            <FileText className="w-12 h-12" style={{ color: 'var(--text-muted)', margin: '0 auto var(--space-4)' }} />
            <h3 style={{ fontSize: 18, fontWeight: 600, marginBottom: 'var(--space-2)' }}>
              No Invoices Yet
            </h3>
            <p className="muted" style={{ marginBottom: 'var(--space-4)' }}>
              Create manual invoices or wait for automated invoices to be generated from fee assignments
            </p>
          </div>
        ) : (
          <div className="card" style={{ overflow: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)' }}>
                  <th style={{ padding: 'var(--space-3)', textAlign: 'left', fontWeight: 600, fontSize: 13 }}>Invoice #</th>
                  <th style={{ padding: 'var(--space-3)', textAlign: 'left', fontWeight: 600, fontSize: 13 }}>Student</th>
                  <th style={{ padding: 'var(--space-3)', textAlign: 'left', fontWeight: 600, fontSize: 13 }}>Date</th>
                  <th style={{ padding: 'var(--space-3)', textAlign: 'left', fontWeight: 600, fontSize: 13 }}>Due Date</th>
                  <th style={{ padding: 'var(--space-3)', textAlign: 'right', fontWeight: 600, fontSize: 13 }}>Amount</th>
                  <th style={{ padding: 'var(--space-3)', textAlign: 'right', fontWeight: 600, fontSize: 13 }}>Paid</th>
                  <th style={{ padding: 'var(--space-3)', textAlign: 'right', fontWeight: 600, fontSize: 13 }}>Balance</th>
                  <th style={{ padding: 'var(--space-3)', textAlign: 'center', fontWeight: 600, fontSize: 13 }}>Status</th>
                  <th style={{ padding: 'var(--space-3)', textAlign: 'center', fontWeight: 600, fontSize: 13 }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {invoices.map((invoice) => (
                  <tr key={invoice.id} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: 'var(--space-3)', fontSize: 14, fontWeight: 600 }}>
                      {invoice.invoice_number}
                      {invoice.invoice_type === 'automated' && (
                        <span style={{ fontSize: 10, marginLeft: 4, color: 'var(--primary)' }}>(AUTO)</span>
                      )}
                    </td>
                    <td style={{ padding: 'var(--space-3)', fontSize: 14 }}>
                      {invoice.student_name || invoice.bill_to_name}
                    </td>
                    <td style={{ padding: 'var(--space-3)', fontSize: 14 }} className="muted">
                      {formatDate(invoice.invoice_date)}
                    </td>
                    <td style={{ padding: 'var(--space-3)', fontSize: 14 }} className="muted">
                      {formatDate(invoice.due_date)}
                    </td>
                    <td style={{ padding: 'var(--space-3)', fontSize: 14, textAlign: 'right', fontWeight: 600 }}>
                      {formatAmount(invoice.total_cents)}
                    </td>
                    <td style={{ padding: 'var(--space-3)', fontSize: 14, textAlign: 'right', color: 'var(--success)' }}>
                      {formatAmount(invoice.paid_cents)}
                    </td>
                    <td style={{ padding: 'var(--space-3)', fontSize: 14, textAlign: 'right', fontWeight: 600 }}>
                      {formatAmount(invoice.balance_cents)}
                    </td>
                    <td style={{ padding: 'var(--space-3)', textAlign: 'center' }}>
                      {getStatusBadge(invoice.status)}
                    </td>
                    <td style={{ padding: 'var(--space-3)', textAlign: 'center' }}>
                      <div style={{ display: 'flex', gap: '4px', justifyContent: 'center' }}>
                        <button
                          className="btn btnSmall btnSecondary"
                          onClick={() => handleViewInvoice(invoice.id)}
                          title="View"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          className="btn btnSmall btnSecondary"
                          onClick={() => handleDownloadPDF(invoice.id)}
                          title="Download PDF"
                        >
                          <Download className="w-4 h-4" />
                        </button>
                        {invoice.status !== 'paid' && (
                          <button
                            className="btn btnSmall btnSecondary"
                            onClick={() => handleSendInvoice(invoice.id)}
                            title="Send Email"
                          >
                            <Send className="w-4 h-4" />
                          </button>
                        )}
                        {invoice.status === 'draft' && (
                          <button
                            className="btn btnSmall"
                            style={{ background: 'var(--danger)', color: '#fff' }}
                            onClick={() => handleDeleteInvoice(invoice.id)}
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Info Box */}
        <div className="card" style={{ padding: 'var(--space-4)', marginTop: 'var(--space-6)', background: 'rgba(99, 102, 241, 0.1)', border: '1px solid rgba(99, 102, 241, 0.3)' }}>
          <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 'var(--space-2)', display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
            <FileText className="w-5 h-5" style={{ color: 'var(--primary)' }} />
            How Invoicing Works
          </h3>
          <ul style={{ fontSize: 14, lineHeight: 1.6 }} className="muted">
            <li>✅ <strong>Automated Invoices:</strong> Generated from fee assignments (includes child details)</li>
            <li>✅ <strong>Manual Invoices:</strong> Create custom invoices for other fees (field trips, books, etc.)</li>
            <li>✅ <strong>Professional Format:</strong> School name, address, logo, itemized breakdown</li>
            <li>✅ <strong>Email Delivery:</strong> Send invoices directly to parents</li>
            <li>✅ <strong>Payment Tracking:</strong> Real-time status updates (sent → viewed → paid)</li>
            <li>✅ <strong>Overdue Management:</strong> Automatic overdue marking</li>
          </ul>
        </div>
      </div>

      {/* Create Manual Invoice Modal - Placeholder */}
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
          zIndex: 1000,
          padding: 'var(--space-4)'
        }}>
          <div className="card" style={{
            width: '100%',
            maxWidth: '600px',
            padding: 'var(--space-6)',
            maxHeight: '90vh',
            overflow: 'auto'
          }}>
            <h2 style={{ fontSize: 20, fontWeight: 'bold', marginBottom: 'var(--space-4)' }}>
              Create Manual Invoice
            </h2>
            
            <p className="muted" style={{ marginBottom: 'var(--space-4)' }}>
              Manual invoice creation UI coming soon! This will allow you to:
            </p>
            
            <ul className="muted" style={{ marginBottom: 'var(--space-4)', paddingLeft: 'var(--space-5)' }}>
              <li>Select student or create custom bill-to</li>
              <li>Add multiple line items with descriptions and amounts</li>
              <li>Set due date and payment terms</li>
              <li>Add notes and custom footer text</li>
              <li>Preview before sending</li>
            </ul>
            
            <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
              <button
                className="btn btnSecondary"
                onClick={() => setShowCreateModal(false)}
                style={{ flex: 1 }}
              >
                Cancel
              </button>
              <button
                className="btn btnPrimary"
                onClick={() => {
                  alert('Manual invoice creation UI will be implemented next!');
                  setShowCreateModal(false);
                }}
                style={{ flex: 1 }}
              >
                Continue
              </button>
            </div>
          </div>
        </div>
      )}
    </PrincipalShell>
  );
}
