"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import OrganizationSelector from "@/components/auth/PreschoolSelector";

function ParentSignUpForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedOrganization, setSelectedOrganization] = useState<any>(null);
  const [invitationCode, setInvitationCode] = useState<string | null>(null);
  const [hasInvitation, setHasInvitation] = useState(false);
  const [invitationLoading, setInvitationLoading] = useState(false);

  // Check for invitation code in URL
  useEffect(() => {
    const invite = searchParams.get('invite');
    if (invite) {
      validateInvitationCode(invite);
    }
  }, [searchParams]);

  async function validateInvitationCode(code: string) {
    setInvitationLoading(true);
    setInvitationCode(code);
    
    try {
      const supabase = createClient();
      
      // Call validation function
      const { data, error } = await supabase.rpc('validate_invitation_code', {
        invite_code: code,
        invite_role: 'parent'
      });

      if (error) throw error;

      if (data && data.length > 0 && data[0].valid) {
        // Valid invitation - auto-select organization
        const orgData = data[0];
        setSelectedOrganization({
          id: orgData.organization_id,
          name: orgData.organization_name,
          type: null,
        });
        setHasInvitation(true);
        setError(null);
      } else {
        setError(data[0]?.error_message || 'Invalid invitation code');
        setInvitationCode(null);
      }
    } catch (err: any) {
      console.error('Invitation validation error:', err);
      setError('Failed to validate invitation code');
      setInvitationCode(null);
    } finally {
      setInvitationLoading(false);
    }
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    // Validation
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }

    if (!selectedOrganization && !invitationCode) {
      setError("Please select an organization or use an invitation code");
      return;
    }

    setLoading(true);

    const supabase = createClient();

    // Create auth user (profile will be auto-created by database trigger)
    const nameParts = fullName.trim().split(' ');
    const firstName = nameParts[0] || fullName;
    const lastName = nameParts.slice(1).join(' ') || '';

    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          first_name: firstName,
          last_name: lastName,
          role: 'parent',
          phone: phoneNumber || null,
        },
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      }
    });

    if (authError) {
      setLoading(false);
      setError(authError.message);
      return;
    }

    if (!authData.user) {
      setLoading(false);
      setError("Failed to create account. Please try again.");
      return;
    }

    // Profile is automatically created by database trigger (create_profile_for_new_user)
    
    // Handle invitation code or join request
    if (invitationCode) {
      // Accept invitation - auto-links user to organization
      const { data: accepted, error: acceptError } = await supabase.rpc('accept_invitation_code', {
        invite_code: invitationCode,
        user_id: authData.user.id
      });
      
      if (acceptError) {
        console.error('Invitation acceptance error:', acceptError);
      }
    } else if (selectedOrganization) {
      // Create join request for manual selection
      const { error: joinError } = await supabase
        .from('parent_join_requests')
        .insert({
          parent_id: authData.user.id,
          organization_id: selectedOrganization.id,
          status: 'pending',
          message: `Parent signup request from ${fullName}`,
        });

      if (joinError) {
        // Handle duplicate request (409 conflict) gracefully
        if (joinError.code === '23505' || joinError.message?.includes('duplicate')) {
          console.log('Join request already exists for this organization');
          // This is fine - user already requested to join this org
        } else {
          console.error('Join request error:', joinError);
        }
        // Don't fail the signup - account is created successfully
      }
    }

    setLoading(false);

    // Success - redirect to email verification notice
    router.push('/sign-up/verify-email');
  }

  return (
    <>
      <style jsx global>{`
        body {
          overflow-x: hidden;
          max-width: 100vw;
        }
      `}</style>
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#0a0a0f", fontFamily: "system-ui, sans-serif", overflowX: "hidden", padding: "20px 0" }}>
        <div style={{ width: "100%", maxWidth: "100vw", background: "#111113", padding: "40px 5%", border: "1px solid #1f1f23", boxSizing: "border-box" }}>
          {/* Header */}
          <div style={{ textAlign: "center", marginBottom: 32 }}>
            <div style={{ width: 64, height: 64, background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)", borderRadius: 16, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px", fontSize: 32 }}>
              👨‍👩‍👧
            </div>
            <h1 style={{ color: "#fff", fontSize: 24, fontWeight: 700, marginBottom: 8 }}>Parent Sign Up</h1>
            <p style={{ color: "#9CA3AF", fontSize: 14 }}>Create your parent account to track your child's progress</p>
            {hasInvitation && selectedOrganization && (
              <div style={{ marginTop: 16, padding: 12, background: "#064e3b", border: "1px solid #047857", borderRadius: 8 }}>
                <p style={{ color: "#6ee7b7", fontSize: 13, margin: 0 }}>
                  ✓ Joining: <strong>{selectedOrganization.name}</strong>
                </p>
              </div>
            )}
          </div>

          <form onSubmit={onSubmit} style={{ display: "flex", flexDirection: "column", gap: 20, maxWidth: 500, margin: "0 auto" }}>
            <div>
              <label style={{ display: "block", color: "#fff", fontSize: 14, fontWeight: 500, marginBottom: 8 }}>Full Name *</label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                placeholder="John Doe"
                style={{ width: "100%", padding: "12px 14px", background: "#1a1a1f", border: "1px solid #2a2a2f", borderRadius: 8, color: "#fff", fontSize: 14, boxSizing: "border-box" }}
              />
            </div>

            <div>
              <label style={{ display: "block", color: "#fff", fontSize: 14, fontWeight: 500, marginBottom: 8 }}>Email *</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="you@example.com"
                style={{ width: "100%", padding: "12px 14px", background: "#1a1a1f", border: "1px solid #2a2a2f", borderRadius: 8, color: "#fff", fontSize: 14, boxSizing: "border-box" }}
              />
            </div>

            <div>
              <label style={{ display: "block", color: "#fff", fontSize: 14, fontWeight: 500, marginBottom: 8 }}>Phone Number (Optional)</label>
              <input
                type="tel"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="+27 82 123 4567"
                style={{ width: "100%", padding: "12px 14px", background: "#1a1a1f", border: "1px solid #2a2a2f", borderRadius: 8, color: "#fff", fontSize: 14, boxSizing: "border-box" }}
              />
            </div>

            {/* Organization Selection (hidden if has invitation) */}
            {!hasInvitation && (
              <OrganizationSelector
                onSelect={setSelectedOrganization}
                selectedOrganizationId={selectedOrganization?.id || null}
              />
            )}

            <div>
              <label style={{ display: "block", color: "#fff", fontSize: 14, fontWeight: 500, marginBottom: 8 }}>Password *</label>
              <div style={{ position: "relative" }}>
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="At least 8 characters"
                  style={{ width: "100%", padding: "12px 14px", background: "#1a1a1f", border: "1px solid #2a2a2f", borderRadius: 8, color: "#fff", fontSize: 14, paddingRight: 40, boxSizing: "border-box" }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: 0, color: "#9CA3AF", cursor: "pointer", fontSize: 18 }}
                >
                  {showPassword ? "👁️" : "👁️‍🗨️"}
                </button>
              </div>
            </div>

            <div>
              <label style={{ display: "block", color: "#fff", fontSize: 14, fontWeight: 500, marginBottom: 8 }}>Confirm Password *</label>
              <input
                type={showPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                placeholder="Re-enter password"
                style={{ width: "100%", padding: "12px 14px", background: "#1a1a1f", border: "1px solid #2a2a2f", borderRadius: 8, color: "#fff", fontSize: 14, boxSizing: "border-box" }}
              />
            </div>

            {error && (
              <div style={{ padding: 12, background: "#7f1d1d", border: "1px solid #991b1b", borderRadius: 8 }}>
                <p style={{ color: "#fca5a5", fontSize: 14, margin: 0 }}>{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              style={{
                width: "100%",
                padding: "14px 16px",
                background: loading ? "#555" : "linear-gradient(135deg, #00f5ff 0%, #0088cc 100%)",
                color: "#000",
                border: 0,
                borderRadius: 8,
                fontSize: 16,
                fontWeight: 700,
                cursor: loading ? "not-allowed" : "pointer",
              }}
            >
              {loading ? "Creating Account..." : "Create Parent Account"}
            </button>

            <p style={{ textAlign: "center", color: "#9CA3AF", fontSize: 13, margin: 0 }}>
              By signing up, you agree to our <Link href="/terms" style={{ color: "#00f5ff" }}>Terms</Link> and <Link href="/privacy" style={{ color: "#00f5ff" }}>Privacy Policy</Link>
            </p>
          </form>

          <div style={{ marginTop: 32, paddingTop: 24, borderTop: "1px solid #2a2a2f", textAlign: "center" }}>
            <p style={{ color: "#9CA3AF", fontSize: 14 }}>
              Already have an account? <Link href="/sign-in" style={{ color: "#00f5ff", fontWeight: 600, textDecoration: "underline" }}>Sign In</Link>
            </p>
            <p style={{ color: "#9CA3AF", fontSize: 14, marginTop: 12 }}>
              Are you a teacher? <Link href="/sign-up/teacher" style={{ color: "#00f5ff", fontWeight: 600, textDecoration: "underline" }}>Sign up as Teacher</Link>
            </p>
          </div>

          <div style={{ marginTop: 24, textAlign: "center" }}>
            <Link href="/" style={{ color: "#00f5ff", fontSize: 14, textDecoration: "none" }}>
              ← Go to Home
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}

export default function ParentSignUpPage() {
  return (
    <Suspense fallback={
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#0a0a0f" }}>
        <div style={{ textAlign: "center", color: "#fff" }}>
          <div style={{ width: 40, height: 40, border: "4px solid #00f5ff", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 1s linear infinite", margin: "0 auto 16px" }} />
          <p>Loading...</p>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      </div>
    }>
      <ParentSignUpForm />
    </Suspense>
  );
}
