/* eslint-disable @typescript-eslint/no-unused-vars */

import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { assertSupabase } from '@/lib/supabase';

type Tier = 'free' | 'starter' | 'basic' | 'premium' | 'pro' | 'enterprise';

type Seats = { total: number; used: number } | null;

type TierSource = 'organization' | 'school_plan' | 'school_default' | 'user' | 'unknown';

type Ctx = {
  ready: boolean;
  tier: Tier;
  seats: Seats;
  tierSource: TierSource;
  tierSourceDetail?: string;
  assignSeat: (subscriptionId: string, userId: string) => Promise<boolean>;
  revokeSeat: (subscriptionId: string, userId: string) => Promise<boolean>;
  refresh: () => void;
};

export const SubscriptionContext = createContext<Ctx>({
  ready: false,
  tier: 'free',
  seats: null,
  tierSource: 'unknown',
  tierSourceDetail: undefined,
  assignSeat: async () => false,
  revokeSeat: async () => false,
  refresh: () => {},
});

export function SubscriptionProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const [tier, setTier] = useState<Tier>('free');
  const [seats, setSeats] = useState<Seats>(null);
  const [tierSource, setTierSource] = useState<TierSource>('unknown');
  const [tierSourceDetail, setTierSourceDetail] = useState<string | undefined>(undefined);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Function to manually refresh subscription data
  const refresh = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  useEffect(() => {
    let mounted = true;
    let timeoutId: ReturnType<typeof setTimeout>;
    
    // Add a small delay to prevent rapid successive calls
    const fetchSubscriptionData = async () => {
      try {
        const { data: userRes, error: userError } = await assertSupabase().auth.getUser();
        if (userError || !userRes.user) {
          if (mounted) setReady(true);
          return;
        }
        
        const user = userRes.user;
        
        if (!mounted) return; // Prevent state updates if unmounted
        
        let t: Tier = 'free';
        let source: TierSource = 'unknown';
        const metaTier = (user?.user_metadata as any)?.subscription_tier as string | undefined;
        if (metaTier && ['free','starter','premium','enterprise'].includes(metaTier)) {
          t = metaTier as Tier;
          source = 'user';
        }

        // Try to detect org or school-owned subscription using schema
        let seatsData: Seats = null;
        try {
          // First, get user's preschool_id AND organization_id from profiles table
          let schoolId: string | undefined;
          let orgId: string | undefined;
          
          // Try user metadata first (fastest)
          schoolId = (user?.user_metadata as any)?.preschool_id;
          orgId = (user?.user_metadata as any)?.organization_id;
          
          // If not in metadata, query profiles table (legacy) then users table (current)
          if ((!schoolId || !orgId) && user.id) {
            try {
              const { data: profileData } = await assertSupabase()
                .from('profiles')
                .select('preschool_id, organization_id')
                .eq('id', user.id)
                .maybeSingle();
              if (profileData?.preschool_id) schoolId = profileData.preschool_id;
              if (profileData?.organization_id) orgId = profileData.organization_id;
            } catch {/* ignore */}
            
            // Current schema commonly stores principals/teachers in users table with auth_user_id
            if ((!schoolId || !orgId)) {
              try {
                const { data: userRow } = await assertSupabase()
                  .from('users')
                  .select('preschool_id, organization_id')
                  .eq('auth_user_id', user.id)
                  .maybeSingle();
                if (userRow?.preschool_id) schoolId = userRow.preschool_id as any;
                if (userRow?.organization_id) orgId = userRow.organization_id as any;
              } catch {/* ignore */}
            }
          }

          // Organization path first
          if (orgId && mounted) {
            try {
              const { data: org } = await assertSupabase()
                .from('organizations')
                .select('plan_tier')
                .eq('id', orgId)
                .maybeSingle();
              if (org?.plan_tier) {
                const tierStr = String(org.plan_tier).toLowerCase();
                const knownTiers: Tier[] = ['free','starter','premium','enterprise'];
                if (knownTiers.includes(tierStr as Tier)) {
                  t = tierStr as Tier;
                  source = 'organization';
                }
              }
            } catch {/* ignore */}
          }
          
          // If still unknown or free, check school subscription
          if (schoolId && mounted && (source === 'unknown' || t === 'free')) {
            try {
              const { data: sub } = await assertSupabase()
                .from('subscriptions')
                .select('id, plan_id, seats_total, seats_used, status')
                .eq('school_id', schoolId)
                .in('status', ['active','trialing'])
                .maybeSingle();
              
              if (sub) {
                try {
                  const { data: planRow } = await assertSupabase()
                    .from('subscription_plans')
                    .select('tier')
                    .eq('id', sub.plan_id)
                    .maybeSingle();
                  const tierStr = (planRow?.tier || '').toLowerCase();
                  const knownTiers: Tier[] = ['free','starter','premium','enterprise'];
                  if (knownTiers.includes(tierStr as Tier)) {
                    t = tierStr as Tier;
                    source = 'school_plan';
                  }
                } catch {/* ignore */}

                seatsData = { total: sub.seats_total ?? 0, used: sub.seats_used ?? 0 };
              } else {
                // Fall back to preschools.subscription_tier
                try {
                  const { data: school } = await assertSupabase()
                    .from('preschools')
                    .select('subscription_tier')
                    .eq('id', schoolId)
                    .maybeSingle();
                  if (school?.subscription_tier) {
                    const tierStr = String(school.subscription_tier).toLowerCase();
                    const knownTiers: Tier[] = ['free','starter','premium','enterprise'];
                    if (knownTiers.includes(tierStr as Tier)) {
                      t = tierStr as Tier;
                      source = 'school_default';
                    }
                  }
                } catch {/* ignore */}
              }
            } catch {/* ignore */}
          }
        } catch {/* ignore */}

        if (mounted) {
          setTier(t);
          setTierSource(source);
          setTierSourceDetail(source);
          setSeats(seatsData);
          setReady(true);
        }
      } catch (err) {
        if (mounted) {
          // Always set ready to true to prevent blocking the UI
          setTier('free'); // Safe fallback
          setSeats(null);
          setReady(true);
        }
      }
    };
    
    // Throttle to prevent excessive calls
    timeoutId = setTimeout(fetchSubscriptionData, 100);
    
    return () => {
      mounted = false;
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [refreshTrigger]); // Add refreshTrigger as dependency

  const assignSeat = async (subscriptionId: string, userId: string) => {
    try {
      const { data, error } = await assertSupabase().rpc('rpc_assign_teacher_seat', { 
        target_user_id: userId 
      });
      
      if (error) {
        console.error('Seat assignment RPC error:', error?.message || error);
        // Throw the error with the actual message so the UI can show it
        throw new Error(error?.message || 'Failed to assign seat');
      }
      return true;
    } catch (err) {
      console.error('Seat assignment failed:', err);
      // Re-throw to let the UI handle it
      throw err;
    }
  };

  const revokeSeat = async (subscriptionId: string, userId: string) => {
    try {
      const { data, error } = await assertSupabase().rpc('rpc_revoke_teacher_seat', { 
        target_user_id: userId 
      });
      
      if (error) {
        console.error('Seat revocation RPC error:', error?.message || error);
        throw new Error(error?.message || 'Failed to revoke seat');
      }
      return true;
    } catch (err) {
      console.error('Seat revocation failed:', err);
      throw err;
    }
  };

  const value = useMemo<Ctx>(() => ({ ready, tier, seats, tierSource, tierSourceDetail, assignSeat, revokeSeat, refresh }), [ready, tier, seats, tierSource, tierSourceDetail]);

  return <SubscriptionContext.Provider value={value}>{children}</SubscriptionContext.Provider>;
}

export function useSubscription() {
  return useContext(SubscriptionContext);
}
