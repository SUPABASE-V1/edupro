'use client';

import { useRouter } from 'next/navigation';
import { 
  BookOpen, FileText, BarChart3, MessageCircle, Calendar, DollarSign,
  Users, GraduationCap, Sparkles, Search, Settings, Home, Target,
  Lightbulb, Award, Zap, MapPin
} from 'lucide-react';

interface QuickAction {
  icon: any;
  label: string;
  href: string;
  color: string;
}

interface QuickActionsGridProps {
  usageType?: 'preschool' | 'k12_school' | 'homeschool' | 'aftercare' | 'supplemental' | 'exploring' | 'independent';
  hasOrganization: boolean;
}

export function QuickActionsGrid({ usageType, hasOrganization }: QuickActionsGridProps) {
  const router = useRouter();

  const getQuickActions = (): QuickAction[] => {
    // Organization-linked actions (common for all with organization)
    const organizationActions: QuickAction[] = hasOrganization ? [
      { icon: MessageCircle, label: 'Messages', href: '/dashboard/parent/messages', color: '#8b5cf6' },
      { icon: Calendar, label: 'Calendar', href: '/dashboard/parent/calendar', color: '#06b6d4' },
      { icon: BarChart3, label: 'Progress', href: '/dashboard/parent/progress', color: '#10b981' },
      { icon: DollarSign, label: 'Payments', href: '/dashboard/parent/payments', color: '#f59e0b' },
      { icon: Users, label: 'My Children', href: '/dashboard/parent/children', color: '#8b5cf6' },
      { icon: Sparkles, label: 'AI Help', href: '/dashboard/parent/ai-help', color: '#ec4899' },
    ] : [];

    // Independent parents - all usage types get same simple actions (existing pages only)
    if (!hasOrganization) {
      return [
        { icon: Users, label: 'My Children', href: '/dashboard/parent/children', color: '#8b5cf6' },
        { icon: Sparkles, label: 'AI Help', href: '/dashboard/parent/ai-help', color: '#ec4899' },
        { icon: BookOpen, label: 'Lessons', href: '/dashboard/parent/lessons', color: '#10b981' },
        { icon: FileText, label: 'Homework', href: '/dashboard/parent/homework', color: '#f59e0b' },
        { icon: BarChart3, label: 'Progress', href: '/dashboard/parent/progress', color: '#06b6d4' },
        { icon: Settings, label: 'Settings', href: '/dashboard/parent/settings', color: '#6366f1' },
      ];
    }
    
    // Organization-linked parents (k12, preschool, aftercare)
    return organizationActions;
  };

  const actions = getQuickActions();

  return (
    <div className="section">
      <div className="sectionTitle">Quick Actions</div>
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
        gap: 'var(--space-3)'
      }}>
        {actions.map((action) => {
          const Icon = action.icon;
          return (
            <button
              key={action.href}
              onClick={() => router.push(action.href)}
              className="qa"
              style={{
                background: 'var(--surface-1)',
                border: '1px solid var(--border)',
                borderRadius: 12,
                padding: 'var(--space-4)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 12,
                cursor: 'pointer',
                transition: 'all 0.2s',
                textAlign: 'center'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-4px)';
                e.currentTarget.style.boxShadow = `0 8px 24px ${action.color}22`;
                e.currentTarget.style.borderColor = action.color;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
                e.currentTarget.style.borderColor = 'var(--border)';
              }}
            >
              <div style={{
                width: 48,
                height: 48,
                borderRadius: 12,
                background: `${action.color}22`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <Icon size={24} style={{ color: action.color }} />
              </div>
              <span style={{ 
                fontSize: 14, 
                fontWeight: 600,
                color: 'var(--text-primary)'
              }}>
                {action.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
