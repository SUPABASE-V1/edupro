/**
 * Quota Checker Service
 * 
 * Enforces AI usage quotas based on subscription tier.
 * Checks BEFORE calling AI to prevent overage charges.
 */

import type { QuotaCheckResult } from '../types.ts'

/**
 * Check if user has quota remaining for the requested service
 */
export async function checkQuota(
  supabaseAdmin: any,
  userId: string,
  organizationId: string | null,
  serviceType: string
): Promise<QuotaCheckResult> {
  try {

    // Get user's current usage for this month
    const startOfMonth = new Date()
    startOfMonth.setDate(1)
    startOfMonth.setHours(0, 0, 0, 0)

    const { data: usageData, error: usageError } = await supabaseAdmin
      .from('ai_usage_logs')
      .select('id')
      .eq('user_id', userId)
      .eq('service_type', serviceType)
      .gte('created_at', startOfMonth.toISOString())
      .eq('status', 'success')

    if (usageError) {
      return { allowed: false, error: usageError.message }
    }

    const used = usageData?.length || 0

    // Default quotas by tier
    const defaultQuotas: Record<string, Record<string, number>> = {
      free: {
        lesson_generation: 5,
        grading_assistance: 5,
        homework_help: 15,
        dash_conversation: 50
      },
      basic: {
        lesson_generation: 20,
        grading_assistance: 20,
        homework_help: 50,
        dash_conversation: 200
      },
      pro: {
        lesson_generation: 100,
        grading_assistance: 100,
        homework_help: 300,
        dash_conversation: 1000
      },
      enterprise: {
        lesson_generation: -1, // unlimited
        grading_assistance: -1,
        homework_help: -1,
        dash_conversation: -1
      }
    }

    // Get subscription tier (default to 'free')
    let tier = 'free'
    if (organizationId) {
      const { data: orgData } = await supabaseAdmin
        .from('preschools')
        .select('subscription_tier')
        .eq('id', organizationId)
        .single()

      if (orgData?.subscription_tier) {
        tier = orgData.subscription_tier.toLowerCase()
      }
    }

    // Get quota limit for this tier and service
    const tierLimits = defaultQuotas[tier] || defaultQuotas.free
    const limit = tierLimits[serviceType] || 10

    // -1 means unlimited (enterprise tier)
    if (limit === -1) {
      return {
        allowed: true,
        quotaInfo: {
          used,
          limit: -1,
          remaining: -1,
          tier,
        },
      }
    }

    // Check if quota exceeded
    const allowed = used < limit

    return {
      allowed,
      quotaInfo: {
        used,
        limit,
        remaining: Math.max(0, limit - used),
        tier,
      },
      ...(allowed ? {} : { error: `Quota exceeded for ${serviceType}. Used ${used}/${limit} this month.` }),
    }
  } catch (error) {
    console.error('Quota check error:', error)
    return {
      allowed: false,
      error: error instanceof Error ? error.message : 'Unknown quota check error',
    }
  }
}

/**
 * Log AI usage to database
 */
export async function logUsage(
  supabaseAdmin: any,
  params: {
    userId: string
    organizationId: string | null
    serviceType: string
    model: string
    status: 'success' | 'error'
    tokensIn: number
    tokensOut: number
    cost: number
    processingTimeMs: number
    inputText?: string
    outputText?: string
    errorMessage?: string
    metadata?: Record<string, any>
  }
): Promise<void> {
  try {
    const { error } = await supabaseAdmin.from('ai_usage_logs').insert({
      user_id: params.userId,
      preschool_id: params.organizationId,
      organization_id: params.organizationId,
      service_type: params.serviceType,
      ai_model_used: params.model,
      status: params.status,
      input_tokens: params.tokensIn,
      output_tokens: params.tokensOut,
      total_cost: params.cost,
      processing_time_ms: params.processingTimeMs,
      input_text: params.inputText,
      output_text: params.outputText,
      error_message: params.errorMessage,
      metadata: params.metadata
    })
    
    if (error) {
      console.error('[quota-checker] Failed to log usage:', error)
    }
  } catch (error) {
    console.error('[quota-checker] Failed to log AI usage:', error)
    // Don't throw - logging failure shouldn't break the request
  }
}

/**
 * Get usage statistics for a user
 */
export async function getUsageStats(
  supabaseAdmin: any,
  userId: string,
  serviceType?: string,
  startDate?: Date,
  endDate?: Date
): Promise<{
  totalCalls: number
  successfulCalls: number
  failedCalls: number
  totalTokens: number
  totalCost: number
}> {

  let query = supabaseAdmin
    .from('ai_usage_logs')
    .select('status, tokens_used, estimated_cost')
    .eq('user_id', userId)

  if (serviceType) {
    query = query.eq('service_type', serviceType)
  }
  if (startDate) {
    query = query.gte('created_at', startDate.toISOString())
  }
  if (endDate) {
    query = query.lte('created_at', endDate.toISOString())
  }

  const { data, error } = await query

  if (error || !data) {
    return {
      totalCalls: 0,
      successfulCalls: 0,
      failedCalls: 0,
      totalTokens: 0,
      totalCost: 0,
    }
  }

  return {
    totalCalls: data.length,
    successfulCalls: data.filter((d: any) => d.status === 'success').length,
    failedCalls: data.filter((d: any) => d.status === 'error').length,
    totalTokens: data.reduce((sum: number, d: any) => sum + (d.tokens_used || 0), 0),
    totalCost: data.reduce((sum: number, d: any) => sum + (d.estimated_cost || 0), 0),
  }
}
