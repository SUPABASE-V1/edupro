'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useTenantSlug } from '@/lib/tenant/useTenantSlug';
import { ParentShell } from '@/components/dashboard/parent/ParentShell';
import { Settings, User, Bell, Lock, Globe, Moon, Sun, Camera, LogOut, Trash2, AlertTriangle } from 'lucide-react';

export default function SettingsPage() {
  const router = useRouter();
  const supabase = createClient();
  const [userEmail, setUserEmail] = useState<string>();
  const [userId, setUserId] = useState<string>();
  const { slug } = useTenantSlug(userId);
  const [loading, setLoading] = useState(true);
  const [darkMode, setDarkMode] = useState(true);
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [signingOut, setSigningOut] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [deleting, setDeleting] = useState(false);

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfileImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSignOut = async () => {
    setSigningOut(true);
    await supabase.auth.signOut();
    router.push('/sign-in');
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== 'DELETE') {
      alert('Please type DELETE to confirm account deletion.');
      return;
    }

    setDeleting(true);
    try {
      // Call delete account function
      const { error } = await supabase.rpc('delete_user_account');
      
      if (error) {
        alert(`Failed to delete account: ${error.message}`);
        setDeleting(false);
        return;
      }

      // Sign out and redirect
      await supabase.auth.signOut();
      router.push('/sign-in?deleted=true');
    } catch (err) {
      alert('An error occurred while deleting your account. Please contact support.');
      setDeleting(false);
    }
  };

  useEffect(() => {
    const initAuth = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        router.push('/sign-in');
        return;
      }

      setUserEmail(session.user.email);
      setUserId(session.user.id);
      setLoading(false);
    };

    initAuth();
  }, [router, supabase]);

  if (loading) {
    return (
      <div className="app">
        <header className="topbar">
          <div className="container topbarRow">
            <div className="brand">EduDash Pro</div>
          </div>
        </header>
        <main className="content container">
          Loading...
        </main>
      </div>
    );
  }

  return (
    <ParentShell tenantSlug={slug} userEmail={userEmail}>
      <div className="container">
        <div className="section">
          <h1 className="h1">Settings</h1>
          <p className="muted">Manage your account preferences</p>
        </div>

        <div className="section">
          <div style={{ maxWidth: 800, display: 'grid', gap: 'var(--space-4)' }}>

            {/* Profile Settings */}
            <div className="card">
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-4)' }}>
                <User className="icon20" style={{ color: 'var(--primary)' }} />
                <h2 className="h2" style={{ margin: 0 }}>Profile</h2>
              </div>
              <div style={{ display: 'grid', gap: 'var(--space-4)' }}>
                {/* Profile Picture */}
                <div>
                  <label className="label">Profile Picture</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', marginTop: 'var(--space-2)' }}>
                    <div style={{ position: 'relative' }}>
                      {profileImage ? (
                        <img
                          src={profileImage}
                          alt="Profile"
                          style={{ width: 80, height: 80, borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--primary)' }}
                        />
                      ) : (
                        <div className="avatar" style={{ width: 80, height: 80, fontSize: 28, border: '2px solid var(--primary)' }}>
                          {userEmail?.[0]?.toUpperCase() || 'U'}
                        </div>
                      )}
                      <label style={{
                        position: 'absolute',
                        bottom: 0,
                        right: 0,
                        width: 28,
                        height: 28,
                        background: 'var(--primary)',
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        boxShadow: 'var(--shadow-md)'
                      }}>
                        <Camera className="icon16" style={{ color: 'white' }} />
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleImageUpload}
                          style={{ display: 'none' }}
                        />
                      </label>
                    </div>
                    <div>
                      <p style={{ fontSize: 14, marginBottom: 4 }}>Upload a profile picture</p>
                      <p className="muted" style={{ fontSize: 12 }}>JPG, PNG or GIF (Max 2MB)</p>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="label">Email</label>
                  <input
                    type="email"
                    value={userEmail}
                    disabled
                    className="input"
                    style={{ opacity: 0.6, cursor: 'not-allowed' }}
                  />
                </div>

                <div>
                  <label className="label">Full Name</label>
                  <input
                    type="text"
                    placeholder="Enter your full name"
                    className="input"
                  />
                </div>

                <button className="btn btnPrimary" style={{ width: 'fit-content' }}>
                  Save Changes
                </button>
              </div>
            </div>

            {/* Notifications */}
            <div className="card">
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-4)' }}>
                <Bell className="icon20" style={{ color: 'var(--primary)' }} />
                <h2 className="h2" style={{ margin: 0 }}>Notifications</h2>
              </div>
              <div style={{ display: 'grid', gap: 'var(--space-3)' }}>
                <div className="listItem">
                  <div>
                    <div style={{ fontWeight: 600, marginBottom: 4 }}>Email Notifications</div>
                    <div className="muted" style={{ fontSize: 12 }}>Receive updates via email</div>
                  </div>
                  <button className="toggle toggleActive">
                    <span className="toggleThumb" style={{ transform: 'translateX(20px)' }} />
                  </button>
                </div>
                <div className="listItem">
                  <div>
                    <div style={{ fontWeight: 600, marginBottom: 4 }}>Push Notifications</div>
                    <div className="muted" style={{ fontSize: 12 }}>Receive push notifications</div>
                  </div>
                  <button className="toggle">
                    <span className="toggleThumb" />
                  </button>
                </div>
              </div>
            </div>

            {/* Appearance */}
            <div className="card">
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-4)' }}>
                {darkMode ? (
                  <Moon className="icon20" style={{ color: 'var(--primary)' }} />
                ) : (
                  <Sun className="icon20" style={{ color: 'var(--primary)' }} />
                )}
                <h2 className="h2" style={{ margin: 0 }}>Appearance</h2>
              </div>
              <div className="listItem">
                <div>
                  <div style={{ fontWeight: 600, marginBottom: 4 }}>Dark Mode</div>
                  <div className="muted" style={{ fontSize: 12 }}>Toggle dark mode</div>
                </div>
                <button
                  onClick={() => setDarkMode(!darkMode)}
                  className={`toggle ${darkMode ? 'toggleActive' : ''}`}
                >
                  <span
                    className="toggleThumb"
                    style={{ transform: darkMode ? 'translateX(20px)' : 'translateX(0)' }}
                  />
                </button>
              </div>
            </div>

            {/* Language */}
            <div className="card">
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-4)' }}>
                <Globe className="icon20" style={{ color: 'var(--primary)' }} />
                <h2 className="h2" style={{ margin: 0 }}>Language</h2>
              </div>
              <select className="input">
                <option>English (South Africa)</option>
                <option>Afrikaans</option>
                <option>Zulu</option>
                <option>Xhosa</option>
              </select>
            </div>

            {/* Security */}
            <div className="card">
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-4)' }}>
                <Lock className="icon20" style={{ color: 'var(--primary)' }} />
                <h2 className="h2" style={{ margin: 0 }}>Security</h2>
              </div>
              <button className="btn btnSecondary" style={{ width: '100%', justifyContent: 'flex-start' }}>
                Change Password
              </button>
            </div>

            {/* Sign Out */}
            <div className="card" style={{ borderColor: 'var(--danger-border)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-4)' }}>
                <LogOut className="icon20" style={{ color: 'var(--danger)' }} />
                <h2 className="h2" style={{ margin: 0 }}>Sign Out</h2>
              </div>
              <p className="muted" style={{ marginBottom: 'var(--space-3)' }}>
                Sign out from your account on this device.
              </p>
              <button
                onClick={handleSignOut}
                disabled={signingOut}
                className="btn"
                style={{
                  width: '100%',
                  background: 'linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)',
                  color: 'white',
                  opacity: signingOut ? 0.5 : 1,
                  cursor: signingOut ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 'var(--space-2)'
                }}
              >
                <LogOut className="icon16" />
                {signingOut ? 'Signing out...' : 'Sign Out'}
              </button>
            </div>

            {/* Delete Account */}
            <div className="card" style={{ 
              background: 'linear-gradient(135deg, rgba(153, 27, 27, 0.3) 0%, rgba(127, 29, 29, 0.25) 100%)',
              border: '2px solid #dc2626',
              boxShadow: '0 4px 16px rgba(220, 38, 38, 0.25)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-4)' }}>
                <Trash2 className="icon20" style={{ color: '#fca5a5' }} />
                <h2 className="h2" style={{ margin: 0, color: '#fca5a5', fontSize: 20 }}>Delete Account</h2>
              </div>
              
              {!showDeleteConfirm ? (
                <>
                  <p style={{ marginBottom: 'var(--space-3)', color: '#fca5a5', fontSize: 14, lineHeight: 1.6 }}>
                    Permanently delete your account and all associated data. This action cannot be undone.
                  </p>
                  <button
                    onClick={() => setShowDeleteConfirm(true)}
                    className="btn"
                    style={{
                      width: '100%',
                      background: 'transparent',
                      border: '2px solid #dc2626',
                      color: '#fca5a5',
                      fontWeight: 700,
                      height: 44,
                      transition: 'all 0.2s ease'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'rgba(220, 38, 38, 0.15)';
                      e.currentTarget.style.borderColor = '#ef4444';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'transparent';
                      e.currentTarget.style.borderColor = '#dc2626';
                    }}
                  >
                    <Trash2 className="icon16" />
                    Delete My Account
                  </button>
                </>
              ) : (
                <div style={{ display: 'grid', gap: 'var(--space-4)' }}>
                  <div style={{
                    background: 'rgba(220, 38, 38, 0.25)',
                    border: '2px solid #dc2626',
                    borderRadius: 10,
                    padding: 'var(--space-4)',
                    display: 'flex',
                    gap: 'var(--space-3)',
                    alignItems: 'flex-start'
                  }}>
                    <AlertTriangle style={{ width: 24, height: 24, color: '#fca5a5', flexShrink: 0, marginTop: 2 }} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 700, color: '#fca5a5', marginBottom: 8, fontSize: 16 }}>
                        ?? Warning: This action is permanent
                      </div>
                      <p style={{ fontSize: 14, margin: 0, lineHeight: 1.6, color: '#fca5a5' }}>
                        All your data, including children profiles, messages, and settings will be permanently deleted.
                        This action cannot be undone.
                      </p>
                    </div>
                  </div>

                  <div>
                    <label style={{ 
                      display: 'block', 
                      fontWeight: 700, 
                      marginBottom: 8, 
                      color: '#fca5a5',
                      fontSize: 15
                    }}>
                      Type DELETE to confirm
                    </label>
                    <input
                      type="text"
                      value={deleteConfirmText}
                      onChange={(e) => setDeleteConfirmText(e.target.value)}
                      placeholder="DELETE"
                      className="input"
                      style={{ 
                        borderColor: '#dc2626',
                        borderWidth: 2,
                        fontSize: 16,
                        fontWeight: 700,
                        letterSpacing: '1px',
                        textAlign: 'center',
                        textTransform: 'uppercase'
                      }}
                    />
                  </div>

                  <div style={{ display: 'flex', gap: 'var(--space-3)', flexWrap: 'wrap' }}>
                    <button
                      onClick={() => {
                        setShowDeleteConfirm(false);
                        setDeleteConfirmText('');
                      }}
                      className="btn btnSecondary"
                      style={{ 
                        flex: 1,
                        minWidth: 120,
                        height: 44,
                        fontWeight: 600
                      }}
                      disabled={deleting}
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleDeleteAccount}
                      disabled={deleteConfirmText !== 'DELETE' || deleting}
                      className="btn"
                      style={{
                        flex: 1,
                        minWidth: 180,
                        height: 44,
                        background: deleteConfirmText === 'DELETE' && !deleting 
                          ? 'linear-gradient(135deg, #dc2626 0%, #7f1d1d 100%)' 
                          : 'rgba(127, 29, 29, 0.5)',
                        borderColor: 'transparent',
                        color: '#ffffff',
                        fontWeight: 700,
                        cursor: deleteConfirmText !== 'DELETE' || deleting ? 'not-allowed' : 'pointer',
                        boxShadow: deleteConfirmText === 'DELETE' && !deleting ? '0 4px 12px rgba(220, 38, 38, 0.4)' : 'none'
                      }}
                    >
                      {deleting ? 'Deleting...' : '??? Permanently Delete Account'}
                    </button>
                  </div>
                </div>
              )}
            </div>

          </div>
        </div>
      </div>
    </ParentShell>
  );
}
