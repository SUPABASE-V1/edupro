/**
 * Model Selection Logic
 * 
 * Selects appropriate Claude model based on:
 * - Subscription tier
 * - Features required (vision, etc.)
 * - Cost optimization
 * 
 * WARP.md Compliance: Single Responsibility (model selection only)
 */

import type { ClaudeModel, SubscriptionTier } from '../types.ts'

/**
 * Tier-based model selection
 * 
 * Rules:
 * - Vision (images) requires Sonnet 3.5
 * - Vision available to Basic tier (R299) and above
 * - Pro/Enterprise tiers get Sonnet for better quality
 * - Free/Starter tiers get Haiku for cost efficiency
 * 
 * @param tier - User's subscription tier
 * @param hasImages - Whether request includes images
 * @returns Claude model to use
 * @throws Error if tier doesn't support requested features
 */
export function selectModelForTier(
  tier: SubscriptionTier,
  hasImages: boolean = false
): ClaudeModel {
  // Vision requires Sonnet 3.5
  if (hasImages) {
    // Only Basic tier (R299) and above get vision
    if (['basic', 'premium', 'pro', 'enterprise'].includes(tier)) {
      return 'claude-3-5-sonnet-20241022'
    }
    throw new Error('Vision features require Basic subscription (R299) or higher')
  }

  // For text-only, use Haiku for lower tiers, Sonnet for premium
  if (['pro', 'enterprise'].includes(tier)) {
    return 'claude-3-5-sonnet-20241022'
  }

  return 'claude-3-haiku-20240307'
}

/**
 * Get model capabilities
 * 
 * Returns what features a model supports
 */
export function getModelCapabilities(model: ClaudeModel): {
  vision: boolean
  maxTokens: number
  costTier: 'low' | 'high'
  description: string
} {
  switch (model) {
    case 'claude-3-haiku-20240307':
      return {
        vision: false,
        maxTokens: 4096,
        costTier: 'low',
        description: 'Fast, cost-effective model for text-only tasks'
      }
    case 'claude-3-5-sonnet-20241022':
      return {
        vision: true,
        maxTokens: 8192,
        costTier: 'high',
        description: 'Advanced model with vision support and superior reasoning'
      }
  }
}

/**
 * Check if tier supports vision features
 */
export function tierSupportsVision(tier: SubscriptionTier): boolean {
  return ['basic', 'premium', 'pro', 'enterprise'].includes(tier)
}

/**
 * Get recommended model for service type
 * 
 * Some services benefit from better models regardless of tier
 */
export function getRecommendedModelForService(
  serviceType: string,
  tier: SubscriptionTier,
  hasImages: boolean = false
): ClaudeModel {
  // Vision always requires Sonnet
  if (hasImages) {
    return selectModelForTier(tier, true)
  }

  // Complex services that benefit from Sonnet
  const complexServices = [
    'lesson_generation',
    'grading_assistance',
    'progress_analysis',
    'insights'
  ]

  // Pro/Enterprise always get Sonnet for complex services
  if (['pro', 'enterprise'].includes(tier) && complexServices.includes(serviceType)) {
    return 'claude-3-5-sonnet-20241022'
  }

  // Default selection
  return selectModelForTier(tier, hasImages)
}

/**
 * Validate model selection
 * 
 * Ensures model is compatible with tier and features
 */
export function validateModelSelection(
  model: ClaudeModel,
  tier: SubscriptionTier,
  hasImages: boolean
): { valid: boolean; error?: string } {
  // Check vision support
  if (hasImages && model === 'claude-3-haiku-20240307') {
    return {
      valid: false,
      error: 'Haiku model does not support vision features'
    }
  }

  // Check tier access for Sonnet
  if (model === 'claude-3-5-sonnet-20241022' && hasImages) {
    if (!tierSupportsVision(tier)) {
      return {
        valid: false,
        error: 'Your subscription tier does not support vision features'
      }
    }
  }

  return { valid: true }
}

/**
 * Get fallback model if primary fails
 * 
 * Useful for error recovery
 */
export function getFallbackModel(
  primaryModel: ClaudeModel,
  tier: SubscriptionTier
): ClaudeModel {
  // If Sonnet fails, try Haiku (text-only)
  if (primaryModel === 'claude-3-5-sonnet-20241022') {
    return 'claude-3-haiku-20240307'
  }

  // Haiku is already the fallback
  return primaryModel
}

/**
 * Estimate token count (rough approximation)
 * 
 * Used for quota checking before API call
 */
export function estimateTokenCount(text: string): number {
  // Rough estimate: ~4 characters per token
  return Math.ceil(text.length / 4)
}

/**
 * Check if request exceeds model's max tokens
 */
export function exceedsMaxTokens(
  model: ClaudeModel,
  estimatedTokens: number
): boolean {
  const capabilities = getModelCapabilities(model)
  return estimatedTokens > capabilities.maxTokens
}
