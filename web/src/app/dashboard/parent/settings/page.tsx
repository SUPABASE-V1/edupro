'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useTenantSlug } from '@/lib/tenant/useTenantSlug';
import { ParentShell } from '@/components/dashboard/parent/ParentShell';
import { Settings, User, Bell, Lock, Globe, Moon, Sun, Upload, LogOut, Camera, AlertTriangle } from 'lucide-react';

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
  const [deletingAccount, setDeletingAccount] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

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
    const confirmed = typeof window !== 'undefined'
      ? window.confirm('Are you sure you want to permanently delete your EduDash Pro account? This action cannot be undone and will remove access immediately.')
      : false;

    if (!confirmed) return;

    try {
      setDeletingAccount(true);
      setDeleteError(null);

      const { data, error } = await supabase.functions.invoke('delete-account', {
        method: 'POST',
        body: { confirm: true },
      });

      if (error || !data?.success) {
        throw error ?? new Error('Failed to delete account');
      }

      await supabase.auth.signOut();
      router.push('/sign-in?accountDeleted=1');
    } catch (err) {
      console.error('[ParentSettings] delete account failed', err);
      setDeleteError('We could not delete your account right now. Please try again or contact support.');
    } finally {
      setDeletingAccount(false);
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
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
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
          <div className="grid gap-6 max-w-3xl">

            {/* Profile Settings */}
            <div className="card p-md">
              <div className="flex items-center gap-3 mb-6">
                <User className="w-5 h-5 text-blue-500" />
                <h2 className="text-lg font-semibold">Profile</h2>
              </div>
              <div className="space-y-5">
                {/* Profile Picture */}
                <div>
                  <label className="block text-sm text-gray-400 mb-4">Profile Picture</label>
                  <div className="flex items-center gap-4">
                    <div className="relative">
                      {profileImage ? (
                        <img
                          src={profileImage}
                          alt="Profile"
                          className="w-20 h-20 rounded-full object-cover border-2 border-blue-500"
                        />
                      ) : (
                        <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center text-white text-2xl font-bold border-2 border-blue-500">
                          {userEmail?.[0]?.toUpperCase() || 'U'}
                        </div>
                      )}
                      <label className="absolute bottom-0 right-0 w-7 h-7 bg-blue-600 hover:bg-blue-700 rounded-full flex items-center justify-center cursor-pointer shadow-lg transition-colors">
                        <Camera className="w-4 h-4 text-white" />
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleImageUpload}
                          className="hidden"
                        />
                      </label>
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-gray-300 mb-1">Upload a profile picture</p>
                      <p className="text-xs text-gray-500">JPG, PNG or GIF (Max 2MB)</p>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm text-gray-400 mb-2">Email</label>
                  <input
                    type="email"
                    value={userEmail}
                    disabled
                    className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Full Name</label>
                  <input
                    type="text"
                    placeholder="Enter your full name"
                    className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-sm font-semibold transition-colors">
                  Save Changes
                </button>
              </div>
            </div>

            {/* Notifications */}
            <div className="card p-md">
              <div className="flex items-center gap-3 mb-6">
                <Bell className="w-5 h-5 text-blue-500" />
                <h2 className="text-lg font-semibold">Notifications</h2>
              </div>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-medium">Email Notifications</div>
                    <div className="text-xs text-gray-400">Receive updates via email</div>
                  </div>
                  <button className="relative inline-flex h-6 w-11 items-center rounded-full bg-blue-600">
                    <span className="translate-x-6 inline-block h-4 w-4 transform rounded-full bg-white transition" />
                  </button>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-medium">Push Notifications</div>
                    <div className="text-xs text-gray-400">Receive push notifications</div>
                  </div>
                  <button className="relative inline-flex h-6 w-11 items-center rounded-full bg-gray-600">
                    <span className="translate-x-1 inline-block h-4 w-4 transform rounded-full bg-white transition" />
                  </button>
                </div>
              </div>
            </div>

            {/* Appearance */}
            <div className="card p-md">
              <div className="flex items-center gap-3 mb-6">
                {darkMode ? (
                  <Moon className="w-5 h-5 text-blue-500" />
                ) : (
                  <Sun className="w-5 h-5 text-blue-500" />
                )}
                <h2 className="text-lg font-semibold">Appearance</h2>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium">Dark Mode</div>
                  <div className="text-xs text-gray-400">Toggle dark mode</div>
                </div>
                <button
                  onClick={() => setDarkMode(!darkMode)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full ${
                    darkMode ? 'bg-blue-600' : 'bg-gray-600'
                  }`}
                >
                  <span
                    className={`${
                      darkMode ? 'translate-x-6' : 'translate-x-1'
                    } inline-block h-4 w-4 transform rounded-full bg-white transition`}
                  />
                </button>
              </div>
            </div>

            {/* Language */}
            <div className="card p-md">
              <div className="flex items-center gap-3 mb-6">
                <Globe className="w-5 h-5 text-blue-500" />
                <h2 className="text-lg font-semibold">Language</h2>
              </div>
              <select className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option>English (South Africa)</option>
                <option>Afrikaans</option>
                <option>Zulu</option>
                <option>Xhosa</option>
              </select>
            </div>

            {/* Security */}
            <div className="card p-md">
              <div className="flex items-center gap-3 mb-6">
                <Lock className="w-5 h-5 text-blue-500" />
                <h2 className="text-lg font-semibold">Security</h2>
              </div>
              <button className="w-full px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-sm font-medium transition-colors text-left">
                Change Password
              </button>
            </div>

            {/* Sign Out */}
            <div className="card p-md border-2 border-red-900/30">
              <div className="flex items-center gap-3 mb-6">
                <LogOut className="w-5 h-5 text-red-500" />
                <h2 className="text-lg font-semibold">Sign Out</h2>
              </div>
              <p className="text-sm text-gray-400 mb-4">
                Sign out from your account on this device.
              </p>
              <button
                onClick={handleSignOut}
                disabled={signingOut}
                className="w-full px-4 py-3 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 disabled:from-gray-700 disabled:to-gray-700 rounded-lg text-sm font-semibold transition-all duration-200 flex items-center justify-center gap-2 disabled:cursor-not-allowed shadow-lg hover:shadow-red-600/30"
              >
                <LogOut className="w-4 h-4" />
                {signingOut ? 'Signing out...' : 'Sign Out'}
              </button>
            </div>

            {/* Delete Account */}
            <div className="card p-md border-2 border-red-800/40 bg-red-950/20">
              <div className="flex items-center gap-3 mb-6">
                <AlertTriangle className="w-5 h-5 text-red-400" />
                <h2 className="text-lg font-semibold text-red-200">Delete Account</h2>
              </div>
              <p className="text-sm text-red-200/80 mb-3">
                Permanently delete your EduDash Pro account, remove access to all Dash AI features, and end your subscription. This cannot be undone.
              </p>
              <ul className="text-xs text-red-100/70 mb-4 space-y-1 list-disc list-inside">
                <li>All devices will be signed out immediately</li>
                <li>Your subscription and trial benefits will stop</li>
                <li>Some records may be retained for regulatory requirements</li>
              </ul>
              {deleteError && (
                <div className="mb-3 rounded-md border border-red-500/50 bg-red-900/40 px-3 py-2 text-xs text-red-100">
                  {deleteError}
                </div>
              )}
              <button
                onClick={handleDeleteAccount}
                disabled={deletingAccount}
                className="w-full px-4 py-3 bg-gradient-to-r from-red-700 to-red-800 hover:from-red-800 hover:to-red-900 disabled:from-gray-700 disabled:to-gray-700 rounded-lg text-sm font-semibold transition-all duration-200 flex items-center justify-center gap-2 disabled:cursor-not-allowed shadow-lg hover:shadow-red-700/40"
              >
                <AlertTriangle className="w-4 h-4" />
                {deletingAccount ? 'Deleting account?' : 'Delete My Account'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </ParentShell>
  );
}
