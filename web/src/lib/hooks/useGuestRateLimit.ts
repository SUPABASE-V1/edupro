/**
 * Guest Rate Limiting Hook
 * 
 * Checks and enforces rate limits for unauthenticated users
 * Uses IP address tracking via backend
 */

import { useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';

interface GuestLimitResponse {
  allowed: boolean;
  usage_count: number;
  limit: number;
  resets_at: string;
  message: string;
}

interface UseGuestRateLimitOptions {
  resourceType?: string;
  dailyLimit?: number;
}

export function useGuestRateLimit(options: UseGuestRateLimitOptions = {}) {
  const {
    resourceType = 'exam_prep',
    dailyLimit = 1
  } = options;

  const [isChecking, setIsChecking] = useState(false);
  const [lastCheck, setLastCheck] = useState<GuestLimitResponse | null>(null);

  /**
   * Get client IP address (approximation for client-side)
   */
  const getClientInfo = async (): Promise<{ ip: string; userAgent: string }> => {
    // In production, IP should come from server-side headers
    // For now, use a placeholder that backend can replace
    return {
      ip: 'CLIENT_IP', // Backend will replace with actual IP
      userAgent: navigator.userAgent
    };
  };

  /**
   * Check if guest has remaining quota
   */
  const checkLimit = useCallback(async (): Promise<GuestLimitResponse> => {
    setIsChecking(true);
    
    try {
      const { ip } = await getClientInfo();
      const supabase = createClient();

      const { data, error } = await supabase.rpc('check_guest_limit', {
        p_ip_address: ip,
        p_resource_type: resourceType,
        p_daily_limit: dailyLimit
      });

      if (error) {
        console.error('[Guest Rate Limit] Check failed:', error);
        // Fail open (allow access) on errors
        return {
          allowed: true,
          usage_count: 0,
          limit: dailyLimit,
          resets_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
          message: 'Rate limit check failed, allowing access'
        };
      }

      setLastCheck(data);
      return data;
    } catch (err) {
      console.error('[Guest Rate Limit] Unexpected error:', err);
      // Fail open
      return {
        allowed: true,
        usage_count: 0,
        limit: dailyLimit,
        resets_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        message: 'Rate limit check error, allowing access'
      };
    } finally {
      setIsChecking(false);
    }
  }, [resourceType, dailyLimit]);

  /**
   * Log usage after successful access
   */
  const logUsage = useCallback(async (metadata: Record<string, any> = {}) => {
    try {
      const { ip, userAgent } = await getClientInfo();
      const supabase = createClient();

      const { error } = await supabase.rpc('log_guest_usage', {
        p_ip_address: ip,
        p_user_agent: userAgent,
        p_resource_type: resourceType,
        p_metadata: metadata
      });

      if (error) {
        console.error('[Guest Rate Limit] Log failed:', error);
      }
    } catch (err) {
      console.error('[Guest Rate Limit] Log error:', err);
    }
  }, [resourceType]);

  /**
   * Check limit and log if allowed
   */
  const checkAndLog = useCallback(async (metadata: Record<string, any> = {}): Promise<{
    allowed: boolean;
    message: string;
    limit: GuestLimitResponse;
  }> => {
    const limit = await checkLimit();

    if (limit.allowed) {
      await logUsage(metadata);
    }

    return {
      allowed: limit.allowed,
      message: limit.message,
      limit
    };
  }, [checkLimit, logUsage]);

  return {
    checkLimit,
    logUsage,
    checkAndLog,
    isChecking,
    lastCheck
  };
}
