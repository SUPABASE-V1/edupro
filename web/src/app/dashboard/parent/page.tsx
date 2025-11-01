'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useParentDashboardData } from '@/lib/hooks/useParentDashboardData';
import { ParentShell } from '@/components/dashboard/parent/ParentShell';
import { DashboardHeader } from '@/components/dashboard/parent/DashboardHeader';
import { TrialBanner } from '@/components/dashboard/parent/TrialBanner';
import { OrganizationBanner } from '@/components/dashboard/parent/OrganizationBanner';
import { ExamWeekBanner } from '@/components/dashboard/parent/ExamWeekBanner';
import { EmergencyExamHelp } from '@/components/dashboard/parent/EmergencyExamHelp';
import { QuickSubjectPractice } from '@/components/dashboard/parent/QuickSubjectPractice';
import { ExamTips } from '@/components/dashboard/parent/ExamTips';
import { PendingRequestsWidget } from '@/components/dashboard/parent/PendingRequestsWidget';
import { EmptyChildrenState } from '@/components/dashboard/parent/EmptyChildrenState';
import { QuickActionsGrid } from '@/components/dashboard/parent/QuickActionsGrid';
import { CAPSActivitiesWidget } from '@/components/dashboard/parent/CAPSActivitiesWidget';
import { ExamPrepWidget } from '@/components/dashboard/exam-prep/ExamPrepWidget';
import { AskAIWidget } from '@/components/dashboard/AskAIWidget';
import { Users, BarChart3 } from 'lucide-react';

export default function ParentDashboard() {
  const router = useRouter();
  const supabase = createClient();
  
  // Get all data from custom hook
  const {
    userId,
    profile,
    userName,
    preschoolName,
    usageType,
    hasOrganization,
    tenantSlug,
    childrenCards,
    activeChildId,
    setActiveChildId,
    childrenLoading,
    metrics,
    unreadCount,
    trialStatus,
    loading,
  } = useParentDashboardData();
  
  // Local state
  const [greeting, setGreeting] = useState('');
  const [showAskAI, setShowAskAI] = useState(false);
  const [aiPrompt, setAIPrompt] = useState('');
  const [aiDisplay, setAIDisplay] = useState('');

  // Set greeting based on time of day
  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting('Good morning');
    else if (hour < 18) setGreeting('Good afternoon');
    else setGreeting('Good evening');
  }, []);

  // Auth guard
  useEffect(() => {
    if (!loading && !userId) {
      router.push('/sign-in');
    }
  }, [loading, userId, router]);

  // Handle AI interactions
  const handleAskFromActivity = async (prompt: string, display: string) => {
    setAIPrompt(prompt);
    setAIDisplay(display);
    setShowAskAI(true);
  };

  const handleCloseAI = () => {
    setShowAskAI(false);
    setAIPrompt('');
    setAIDisplay('');
  };

  // Handle exam prep navigation
  const handleStartExamPrep = () => {
    // Scroll to exam prep widget or show AI with exam context
    setAIPrompt('I need help preparing for my exams next week. Can you help me create a study plan?');
    setAIDisplay('Exam Preparation Assistant');
    setShowAskAI(true);
  };

  const handleSubjectPractice = (subject: string) => {
    setAIPrompt(`Generate a practice test for ${subject}. Include questions with a memorandum.`);
    setAIDisplay(`${subject} Practice Test`);
    setShowAskAI(true);
  };

  // Loading state
  if (loading) {
    return (
      <div className="app" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
        <div className="spinner"></div>
      </div>
    );
  }

  // Active child
  const activeChild = childrenCards.find((c) => c.id === activeChildId);

  return (
    <ParentShell
      tenantSlug={tenantSlug}
      userEmail={profile?.email}
      userName={userName}
      preschoolName={preschoolName}
      unreadCount={unreadCount}
      hasOrganization={hasOrganization}
    >
      <div className="container">
        {/* Header */}
        <DashboardHeader userName={userName} greeting={greeting} />

        {/* Trial Banner */}
        <TrialBanner trialStatus={trialStatus} />

        {/* Exam Week Banner - Show for all parents with children */}
        {childrenCards.length > 0 && (
          <ExamWeekBanner onStartExamPrep={handleStartExamPrep} />
        )}

        {/* Organization Banner (ONLY if has organization) */}
        <OrganizationBanner
          hasOrganization={hasOrganization}
          preschoolName={preschoolName}
          userId={userId}
        />

        {/* Pending Requests (ONLY for organization-linked parents) */}
        {hasOrganization && <PendingRequestsWidget userId={userId} />}

        {/* Children Section */}
        {childrenCards.length === 0 && !childrenLoading && (
          <EmptyChildrenState
            usageType={usageType}
            onAddChild={() => router.push('/dashboard/parent/children/add')}
          />
        )}

        {childrenCards.length > 0 && (
          <div className="section">
            <div className="sectionTitle">
              <Users className="icon16" style={{ color: '#a78bfa' }} />
              My Children
            </div>
            <div style={{ 
              display: 'flex', 
              gap: 'var(--space-3)', 
              overflowX: 'auto', 
              paddingBottom: 'var(--space-2)' 
            }}>
              {childrenCards.map((child) => (
                <div
                  key={child.id}
                  className="card"
                  style={{
                    padding: 'var(--space-4)',
                    cursor: 'pointer',
                    border: activeChildId === child.id ? '2px solid var(--primary)' : undefined,
                    minWidth: '280px',
                    flexShrink: 0
                  }}
                  onClick={() => setActiveChildId(child.id)}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', marginBottom: 'var(--space-3)' }}>
                    <div className="avatar" style={{ width: 48, height: 48, fontSize: 20 }}>
                      {child.firstName[0]}{child.lastName[0]}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 700, fontSize: 16 }}>
                        {child.firstName} {child.lastName}
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--muted)' }}>
                        {child.grade}
                      </div>
                    </div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-2)' }}>
                    <div style={{ fontSize: 11, color: 'var(--muted)' }}>
                      <div style={{ fontWeight: 600, fontSize: 16 }}>{child.homeworkPending}</div>
                      Homework
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--muted)' }}>
                      <div style={{ fontWeight: 600, fontSize: 16 }}>{child.upcomingEvents}</div>
                      Events
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Quick Actions Grid */}
        <QuickActionsGrid usageType={usageType} hasOrganization={hasOrganization} />

        {/* Emergency Exam Help - Priority Access to AI Tutor */}
        {childrenCards.length > 0 && (
          <EmergencyExamHelp onClick={handleStartExamPrep} />
        )}

        {/* Quick Subject Practice - One-Click Practice Tests */}
        {activeChild && (
          <QuickSubjectPractice
            childAge={activeChild.progressScore > 80 ? 15 : 10}
            onSelectSubject={handleSubjectPractice}
          />
        )}

        {/* Exam Tips - Study Best Practices */}
        {childrenCards.length > 0 && <ExamTips />}

        {/* Overview Section (ONLY for organization-linked parents) */}
        {hasOrganization && (
          <div className="section">
            <div className="sectionTitle">
              <BarChart3 className="icon16" style={{ color: '#60a5fa' }} />
              Overview
            </div>
            <div className="grid2">
              <div className="card tile">
                <div className="metricValue">{unreadCount}</div>
                <div className="metricLabel">Unread Messages</div>
              </div>
              <div className="card tile">
                <div className="metricValue">{activeChild ? metrics.pendingHomework : 0}</div>
                <div className="metricLabel">Homework Pending</div>
              </div>
              <div className="card tile">
                <div className="metricValue">0%</div>
                <div className="metricLabel">Attendance Rate</div>
              </div>
              <div className="card tile">
                <div className="metricValue">{childrenCards.length}</div>
                <div className="metricLabel">Total Children</div>
              </div>
            </div>
          </div>
        )}

        {/* CAPS Activities Widget */}
        {activeChild && (
          <div className="section">
            <CAPSActivitiesWidget
              childAge={activeChild.progressScore > 80 ? 6 : 5}
              childName={activeChild.firstName}
              onAskDashAI={(prompt, display) => handleAskFromActivity(prompt, display)}
            />
          </div>
        )}

        {/* Exam Prep Widget */}
        {activeChild && activeChild.progressScore > 50 && (
          <div className="section">
            <div className="card" style={{ 
              padding: 'var(--space-5)', 
              background: 'linear-gradient(135deg, rgba(251, 191, 36, 0.05) 0%, rgba(245, 158, 11, 0.05) 100%)', 
              border: '1px solid rgba(251, 191, 36, 0.2)' 
            }}>
              <ExamPrepWidget
                onAskDashAI={(prompt, display) => handleAskFromActivity(prompt, display)}
                guestMode={false}
              />
            </div>
          </div>
        )}
      </div>

      {/* AI Widget Modal */}
      {showAskAI && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.8)',
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 20
        }}>
          <div style={{ width: '100%', maxWidth: 800, position: 'relative' }}>
            <button
              onClick={handleCloseAI}
              style={{
                position: 'absolute',
                top: -40,
                right: 0,
                background: 'rgba(255, 255, 255, 0.1)',
                border: 'none',
                borderRadius: 8,
                padding: 8,
                cursor: 'pointer',
                color: 'white'
              }}
            >
              Close
            </button>
            <AskAIWidget
              userId={userId || ''}
              userRole={profile?.role || 'parent'}
              userName={userName}
              preschoolName={preschoolName}
              initialPrompt={aiPrompt}
              initialDisplayText={aiDisplay}
              onClose={handleCloseAI}
            />
          </div>
        </div>
      )}
    </ParentShell>
  );
}
