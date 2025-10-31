'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import {
  MessageCircle,
  Users,
  LayoutDashboard,
  LogOut,
  Search,
  Bell,
  ArrowLeft,
  Settings,
  Menu,
  X,
  DollarSign,
  Calendar,
  FileText,
  Zap,
  Home,
} from 'lucide-react';

interface ParentShellProps {
  tenantSlug?: string;
  userEmail?: string;
  userName?: string;
  preschoolName?: string;
  unreadCount?: number;
  children: React.ReactNode;
  rightSidebar?: React.ReactNode;
  onOpenDashAI?: () => void;
}

export function ParentShell({ tenantSlug, userEmail, userName, preschoolName, unreadCount = 0, children, rightSidebar, onOpenDashAI }: ParentShellProps) {
  const router = useRouter();
  const pathname = usePathname();
  const supabase = createClient();
  const avatarLetter = useMemo(() => (userName?.[0] || userEmail?.[0] || 'P').toUpperCase(), [userName, userEmail]);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [mobileWidgetsOpen, setMobileWidgetsOpen] = useState(false);

  const nav = [
    { href: '/dashboard/parent', label: 'Home', icon: Home },
    { href: '/dashboard/parent/children', label: 'My Children', icon: Users },
    { href: '/dashboard/parent/payments', label: 'Fees & Payments', icon: DollarSign },
    { href: '/dashboard/parent/calendar', label: 'Calendar', icon: Calendar },
    { href: '/dashboard/parent/homework', label: 'Homework', icon: FileText },
    { href: '/dashboard/parent/messages', label: 'Messages', icon: MessageCircle, badge: unreadCount },
    { href: '/dashboard/parent/settings', label: 'Settings', icon: Settings },
  ];

  // Check if we should show back button (not on dashboard home)
  const showBackButton = pathname !== '/dashboard/parent';

  return (
    <div className="app">
      <header className="topbar">
        <div className="topbarRow topbarEdge">
          <div className="leftGroup">
            <button 
              className="iconBtn mobile-nav-btn" 
              aria-label="Menu" 
              onClick={() => setMobileNavOpen(true)}
              style={{ display: 'none' }}
            >
              <Menu className="icon20" />
            </button>
            
            {showBackButton && (
              <button className="iconBtn desktop-back-btn" aria-label="Back" onClick={() => router.back()}>
                <ArrowLeft className="icon20" />
              </button>
            )}
            {preschoolName ? (
              <div className="chip" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ fontSize: 16 }}>🎓</span>
                <span style={{ fontWeight: 600 }}>{preschoolName}</span>
              </div>
            ) : (
              <div className="chip">{tenantSlug || 'EduDash Pro'}</div>
            )}
          </div>
          <div className="rightGroup" style={{ marginLeft: 'auto' }}>
            <div className="avatar">{avatarLetter}</div>
          </div>
        </div>
      </header>

      <div className="frame">
        <aside className="sidenav sticky" aria-label="Sidebar">
          <div className="sidenavCol">
            <nav className="nav">
              {nav.map((it) => {
                const Icon = it.icon as any;
                const active = pathname === it.href || pathname?.startsWith(it.href + '/');
                return (
                  <Link key={it.href} href={it.href} className={`navItem ${active ? 'navItemActive' : ''}`} aria-current={active ? 'page' : undefined}>
                    <Icon className="navIcon" />
                    <span>{it.label}</span>
                    {typeof it.badge === 'number' && it.badge > 0 && (
                      <span className="navItemBadge badgeNumber">{it.badge}</span>
                    )}
                  </Link>
                );
              })}
            </nav>
            
            {/* Dash AI Quick Access */}
            <div style={{ padding: 'var(--space-3)', borderTop: '1px solid var(--border)' }}>
              <button
                className="navItem"
                style={{ width: '100%', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white' }}
                onClick={() => onOpenDashAI?.()}
              >
                <Zap className="navIcon" />
                <span>Ask Dash AI</span>
              </button>
            </div>

            <div className="sidenavFooter">
              <button
                className="navItem"
                onClick={async () => { await supabase.auth.signOut(); router.push('/sign-in'); }}
              >
                <LogOut className="navIcon" />
                <span>Sign out</span>
              </button>
              <div className="brandPill w-full text-center">Powered by EduDash Pro</div>
            </div>
          </div>
        </aside>

        <main className="content">
          {children}
        </main>

        {/* Right Sidebar for Widgets */}
        {rightSidebar && (
          <>
            <aside className="right sticky" aria-label="At a glance">
              {rightSidebar}
            </aside>
            
            {/* Mobile Widgets Button */}
            <button
              className="mobile-widgets-btn"
              onClick={() => setMobileWidgetsOpen(true)}
              style={{
                position: 'fixed',
                bottom: 'var(--space-4)',
                right: 'var(--space-4)',
                width: 56,
                height: 56,
                borderRadius: '50%',
                background: 'var(--primary)',
                color: 'white',
                border: 'none',
                boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                cursor: 'pointer',
                display: 'none',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 100
              }}
              aria-label="Open widgets"
            >
              <Zap className="w-6 h-6" />
            </button>
          </>
        )}
      </div>

      {/* Mobile Navigation Drawer (Left Sidebar) */}
      {mobileNavOpen && (
        <>
          <div 
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(0, 0, 0, 0.85)',
              zIndex: 9998,
              display: 'none',
            }}
            className="mobile-nav-overlay"
            onClick={() => setMobileNavOpen(false)}
          />
          <div 
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              bottom: 0,
              width: '80%',
              maxWidth: 320,
              background: 'var(--surface-1)',
              zIndex: 9999,
              overflowY: 'auto',
              padding: 'var(--space-4)',
              display: 'none',
              animation: 'slideInLeft 0.3s ease-out',
            }}
            className="mobile-nav-drawer"
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-4)' }}>
              <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>Menu</h3>
              <button 
                onClick={() => setMobileNavOpen(false)}
                className="iconBtn"
                aria-label="Close"
              >
                <X className="icon20" />
              </button>
            </div>
            
            {/* Navigation Links */}
            <nav className="nav" style={{ display: 'grid', gap: 6 }}>
              {nav.map((it) => {
                const Icon = it.icon as any;
                const active = pathname === it.href || pathname?.startsWith(it.href + '/');
                return (
                  <Link 
                    key={it.href} 
                    href={it.href} 
                    className={`navItem ${active ? 'navItemActive' : ''}`}
                    onClick={() => setMobileNavOpen(false)}
                  >
                    <Icon className="navIcon" />
                    <span>{it.label}</span>
                    {typeof it.badge === 'number' && it.badge > 0 && (
                      <span className="navItemBadge badgeNumber">{it.badge}</span>
                    )}
                  </Link>
                );
              })}
            </nav>
            
            {/* Dash AI Quick Access */}
            <div style={{ padding: 'var(--space-3)', borderBottom: '1px solid var(--border)', marginBottom: 'var(--space-3)' }}>
              <button
                className="navItem"
                style={{ width: '100%', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white' }}
                onClick={() => {
                  setMobileNavOpen(false);
                  onOpenDashAI?.();
                }}
              >
                <Zap className="navIcon" />
                <span>Ask Dash AI</span>
              </button>
            </div>

            {/* Footer */}
            <div style={{ marginTop: 'auto', paddingTop: 'var(--space-4)' }}>
              <button
                className="navItem"
                style={{ width: '100%' }}
                onClick={async () => { 
                  await supabase.auth.signOut(); 
                  router.push('/sign-in'); 
                }}
              >
                <LogOut className="navIcon" />
                <span>Sign out</span>
              </button>
              <div className="brandPill" style={{ marginTop: 'var(--space-2)', width: '100%', textAlign: 'center' }}>Powered by EduDash Pro</div>
            </div>
          </div>
        </>
      )}

      {/* Mobile Widgets Drawer (Right Sidebar for At a Glance) */}
      {mobileWidgetsOpen && rightSidebar && (
        <>
          <div 
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(0, 0, 0, 0.85)',
              zIndex: 9998,
              display: 'none',
            }}
            className="mobile-widgets-overlay"
            onClick={() => setMobileWidgetsOpen(false)}
          />
          <div 
            style={{
              position: 'fixed',
              top: 0,
              right: 0,
              bottom: 0,
              width: '85%',
              maxWidth: 360,
              background: 'var(--surface-1)',
              zIndex: 9999,
              overflowY: 'auto',
              padding: 'var(--space-4)',
              display: 'none',
              animation: 'slideInRight 0.3s ease-out',
            }}
            className="mobile-widgets-drawer"
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-4)' }}>
              <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>Quick Access</h3>
              <button 
                onClick={() => setMobileWidgetsOpen(false)}
                className="iconBtn"
                aria-label="Close"
              >
                <X className="icon20" />
              </button>
            </div>
            {rightSidebar}
          </div>
        </>
      )}

      <style jsx>{`
        @media (max-width: 1023px) {
          /* Show mobile navigation button */
          .mobile-nav-btn {
            display: grid !important;
          }
          /* Hide desktop back button on mobile, use hamburger instead */
          .desktop-back-btn {
            display: none !important;
          }
          /* Show overlays and drawers */
          .mobile-nav-overlay,
          .mobile-nav-drawer {
            display: block !important;
          }
          .mobile-widgets-overlay,
          .mobile-widgets-drawer {
            display: block !important;
          }
          /* Show floating Dash AI button */
          .mobile-widgets-btn {
            display: flex !important;
          }
        }
        @keyframes slideInLeft {
          from {
            transform: translateX(-100%);
          }
          to {
            transform: translateX(0);
          }
        }
        @keyframes slideInRight {
          from {
            transform: translateX(100%);
          }
          to {
            transform: translateX(0);
          }
        }
      `}</style>
    </div>
  );
}
