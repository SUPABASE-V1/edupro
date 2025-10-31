import { logger } from '@/lib/logger';
import { useState, useEffect, useMemo } from 'react'
import { useSubscription } from '@/contexts/SubscriptionContext'
import { 
  AIModelId, 
  AIModelInfo, 
  SubscriptionTier,
  getModelsForTier, 
  getDefaultModelForTier, 
  canAccessModel,
  getTierQuotas
} from '@/lib/ai/models'

export interface AIModelSelectionState {
  availableModels: AIModelInfo[]
  selectedModel: AIModelId
  canSelectModel: (modelId: AIModelId) => boolean
  setSelectedModel: (modelId: AIModelId) => void
  tier: SubscriptionTier
  quotas: {
    ai_requests: number
    priority_support: boolean
    rpm_limit: number
  }
  isLoading: boolean
}

/**
 * Hook for managing AI model selection based on user's subscription tier
 * 
 * @param feature - The AI feature being used (for quota tracking)
 * @param initialModel - Optional initial model selection
 * @returns Model selection state and controls
 */
export function useAIModelSelection(
  feature: string = 'ai_requests',
  initialModel?: AIModelId
): AIModelSelectionState {
  const { tier: subscriptionTier, ready } = useSubscription()
  const [selectedModel, setSelectedModelState] = useState<AIModelId>('claude-3-haiku')
  const [isLoading, setIsLoading] = useState(true)

  // Normalize tier for consistency
  const tier = useMemo((): SubscriptionTier => {
    if (!subscriptionTier) return 'free'
    
    // Handle legacy tier names
    switch (subscriptionTier.toLowerCase()) {
      case 'parent_starter':
      case 'starter':
        return 'starter'
      case 'parent_plus':
      case 'premium':
      case 'pro':
        return 'premium'
      case 'enterprise':
        return 'enterprise'
      default:
        return 'free'
    }
  }, [subscriptionTier])

  // Get available models based on tier
  const availableModels = useMemo(() => {
    return getModelsForTier(tier)
  }, [tier])

  // Get tier quotas
  const quotas = useMemo(() => {
    return getTierQuotas(tier)
  }, [tier])

  // Set default model when tier changes
  useEffect(() => {
    if (!ready) return

    const defaultModel = initialModel || getDefaultModelForTier(tier)
    
    // If current selection is not available in this tier, switch to default
    if (!canAccessModel(tier, selectedModel)) {
      setSelectedModelState(defaultModel)
    } else if (initialModel && canAccessModel(tier, initialModel)) {
      setSelectedModelState(initialModel)
    }

    setIsLoading(false)
  }, [tier, ready, initialModel, selectedModel])

  // Check if user can access a specific model
  const canSelectModel = (modelId: AIModelId): boolean => {
    return canAccessModel(tier, modelId)
  }

  // Safe model setter that respects tier limits
  const setSelectedModel = (modelId: AIModelId) => {
    if (canSelectModel(modelId)) {
      setSelectedModelState(modelId)
    } else {
      logger.warn(`Model ${modelId} not available for tier ${tier}, using default`)
      setSelectedModelState(getDefaultModelForTier(tier))
    }
  }

  return {
    availableModels,
    selectedModel,
    canSelectModel,
    setSelectedModel,
    tier,
    quotas,
    isLoading: isLoading || !ready
  }
}

/**
 * Hook specifically for lesson generation with appropriate model defaults
 */
export function useLessonGeneratorModels(initialModel?: AIModelId) {
  return useAIModelSelection('lesson_generation', initialModel)
}

/**
 * Hook specifically for homework help with appropriate model defaults
 */
export function useHomeworkHelperModels(initialModel?: AIModelId) {
  return useAIModelSelection('homework_help', initialModel)
}

/**
 * Hook specifically for grading assistance with appropriate model defaults
 */
export function useGradingModels(initialModel?: AIModelId) {
  return useAIModelSelection('grading_assistance', initialModel)
}

/**
 * Simple tier display information hook
 */
export function useTierInfo() {
  const { tier: subscriptionTier, ready } = useSubscription()
  
  const tierInfo = useMemo(() => {
    if (!subscriptionTier) return null
    
    const normalizedTier = subscriptionTier.toLowerCase()
    
    switch (normalizedTier) {
      case 'free':
        return {
          name: 'Free Plan',
          color: '#6B7280',
          badge: 'Free',
          description: 'Basic AI assistance'
        }
      case 'starter':
      case 'parent_starter':
        return {
          name: 'Starter Plan', 
          color: '#059669',
          badge: 'Starter',
          description: 'Enhanced AI with better models'
        }
      case 'premium':
      case 'parent_plus':
      case 'pro':
        return {
          name: 'Premium Plan',
          color: '#7C3AED', 
          badge: 'Premium',
          description: 'Advanced AI with all models'
        }
      case 'enterprise':
        return {
          name: 'Enterprise Plan',
          color: '#DC2626',
          badge: 'Enterprise', 
          description: 'Unlimited AI with priority support'
        }
      default:
        return {
          name: 'Free Plan',
          color: '#6B7280',
          badge: 'Free',
          description: 'Basic AI assistance'
        }
    }
  }, [subscriptionTier])
  
  return {
    tierInfo,
    isLoading: !ready
  }
}