import { createClient } from '@/lib/supabase/client';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next');

  if (code) {
    const supabase = createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    
    if (!error && data.session) {
      // Successfully verified email - sign out user and redirect to sign-in page
      // This allows them to sign in with their verified credentials
      await supabase.auth.signOut();
      
      return NextResponse.redirect(`${origin}/sign-in?verified=true`);
    }
  }

  // If there's an error or no code, redirect to sign-in with error
  return NextResponse.redirect(`${origin}/sign-in?error=verification_failed`);
}
