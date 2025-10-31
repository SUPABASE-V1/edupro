/**
 * Trial Configuration - Single Source of Truth
 * ============================================
 * All trial-related constants should reference this file
 */

export const TRIAL_CONFIG = {
  // Core trial settings
  DURATION_DAYS: 7,
  GRACE_PERIOD_DAYS: 1,
  
  // Display strings
  TRIAL_DISPLAY: '7-day free trial',
  TRIAL_DAYS_TEXT: '7 days',
  TRIAL_PERIOD: '7-Day Free Trial',
  
  // Limits
  SCHOOL_TRIAL_QUERIES: 100,
  PARENT_TRIAL_QUERIES: 30,
  
  // Guest mode
  GUEST_DAILY_LIMIT: 3,
  GUEST_REQUIRES_SIGNUP_AFTER: 3,
} as const;

/**
 * Get trial end date from start date
 */
export function getTrialEndDate(startDate: Date = new Date()): Date {
  const endDate = new Date(startDate);
  endDate.setDate(endDate.getDate() + TRIAL_CONFIG.DURATION_DAYS);
  return endDate;
}

/**
 * Get billing date (trial end + grace period)
 */
export function getNextBillingDate(trialStartDate: Date = new Date()): Date {
  const billingDate = new Date(trialStartDate);
  billingDate.setDate(
    billingDate.getDate() + 
    TRIAL_CONFIG.DURATION_DAYS + 
    TRIAL_CONFIG.GRACE_PERIOD_DAYS
  );
  return billingDate;
}

/**
 * Calculate days remaining in trial
 */
export function getTrialDaysRemaining(trialEndDate: Date): number {
  const now = new Date();
  const diff = trialEndDate.getTime() - now.getTime();
  const daysRemaining = Math.ceil(diff / (1000 * 60 * 60 * 24));
  return Math.max(0, daysRemaining);
}

/**
 * Check if trial is still active
 */
export function isTrialActive(trialEndDate: Date): boolean {
  return getTrialDaysRemaining(trialEndDate) > 0;
}
