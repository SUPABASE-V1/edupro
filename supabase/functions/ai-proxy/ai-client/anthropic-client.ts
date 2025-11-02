/**
 * Anthropic Claude API Client
 * 
 * Handles all communication with Claude API:
 * - Message sending (text + images)
 * - Streaming support
 * - Tool calling
 * - Conversation history
 * - Token counting and cost calculation
 * - Error handling
 * 
 * WARP.md Compliance: Single Responsibility (AI API communication only)
 */

import type {
  ClaudeModel,
  ClaudeTool,
  AnthropicClientConfig,
  AnthropicResponse,
  StreamingResponse,
  ConversationMessage
} from '../types.ts'

// Model pricing per million tokens
const MODEL_PRICING: Record<ClaudeModel, { input: number; output: number }> = {
  'claude-3-haiku-20240307': {
    input: 0.00000025,   // $0.25/1M tokens
    output: 0.00000125,  // $1.25/1M tokens
  },
  'claude-3-5-sonnet-20241022': {
    input: 0.000003,     // $3.00/1M tokens
    output: 0.000015,    // $15.00/1M tokens
  }
}

/**
 * System prompt for Dash AI Assistant
 * 
 * Defines personality, behavior, and multilingual support
 */
const DASH_SYSTEM_PROMPT = `You are Dash, a smart colleague helping with EduDash Pro.

🌍 MULTILINGUAL CONVERSATION RULES:
- If user speaks Zulu → respond naturally in Zulu
- If user speaks Afrikaans → respond naturally in Afrikaans  
- If user speaks English → respond naturally in English
- DO NOT explain what the user said or translate
- DO NOT teach language unless explicitly asked
- Just have a normal conversation in their language

EXAMPLES:
❌ BAD: "'Unjani' means 'How are you' in Zulu. It's a common greeting..."
✅ GOOD: "Ngiyaphila, ngiyabonga! Wena unjani?" (if they spoke Zulu)

❌ BAD: "You asked 'How are you' in Zulu. Let me explain the counting song 'Onjani desh'..."
✅ GOOD: "Ngiyaphila kahle, ngiyabonga ukubuza. Ungisiza kanjani namuhla?"

RESPONSE STYLE:
- Natural, conversational (like a smart colleague)
- Answer in 1-3 sentences for greetings
- Match the user's language WITHOUT commenting on it
- State facts only - if you don't know, say "I don't have that information"
- NO educational lectures unless teaching is requested

CRITICAL:
- NEVER make up data (student counts, assignments, etc)
- If you don't have specific data, say "I need to check the database"
- NO theatrical narration (*clears throat*, *smiles*, etc.)
- Focus on being helpful, not educational by default`

/**
 * Build message content array for Claude API
 * 
 * Handles text-only and multi-modal (text + images) messages
 */
function buildMessageContent(
  text: string,
  images?: Array<{ data: string; media_type: string }>
): any {
  if (!images || images.length === 0) {
    // Text-only message
    return text
  }

  // Multi-modal message with images
  return [
    ...images.map(img => ({
      type: 'image',
      source: {
        type: 'base64',
        media_type: img.media_type,
        data: img.data,
      }
    })),
    {
      type: 'text',
      text
    }
  ]
}

/**
 * Calculate API cost based on token usage
 */
export function calculateCost(
  model: ClaudeModel,
  tokensIn: number,
  tokensOut: number
): number {
  const pricing = MODEL_PRICING[model]
  return (tokensIn * pricing.input) + (tokensOut * pricing.output)
}

/**
 * Call Claude API with full configuration
 * 
 * @param config - Complete configuration object
 * @returns API response with content, tokens, and cost
 * 
 * Features:
 * - Text and multi-modal (images) support
 * - Streaming support (returns raw Response)
 * - Tool calling (agentic AI)
 * - Conversation history
 * - Automatic cost calculation
 */
export async function callClaude(
  config: AnthropicClientConfig
): Promise<AnthropicResponse> {
  const {
    apiKey,
    model,
    prompt,
    images,
    stream = false,
    tools,
    conversationHistory,
    systemPrompt = DASH_SYSTEM_PROMPT,
    maxTokens = 4096
  } = config

  if (!apiKey) {
    throw new Error('Anthropic API key not configured')
  }

  // Build message content
  const messageContent = buildMessageContent(prompt, images)

  // Build request body
  const requestBody: any = {
    model,
    max_tokens: maxTokens,
    stream,
    system: systemPrompt,
    messages: conversationHistory || [
      {
        role: 'user',
        content: messageContent
      }
    ]
  }

  // Add tools if provided
  if (tools && tools.length > 0) {
    requestBody.tools = tools
  }

  // Call Claude API
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify(requestBody)
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Claude API error: ${response.status} ${error}`)
  }

  // If streaming, return raw response for processing
  if (stream) {
    return {
      content: '',  // Will be streamed
      tokensIn: 0,  // Will be calculated after stream completes
      tokensOut: 0,
      cost: 0,
      model,
      response  // Pass through raw response
    }
  }

  // Non-streaming: parse full response
  const result = await response.json()

  const tokensIn = result.usage?.input_tokens || 0
  const tokensOut = result.usage?.output_tokens || 0

  // Calculate cost
  const cost = calculateCost(model, tokensIn, tokensOut)

  // Extract tool use if present
  const toolUse = result.content
    ?.filter((block: any) => block.type === 'tool_use')
    .map((block: any) => ({
      id: block.id,
      name: block.name,
      input: block.input
    })) || []

  // Extract text content
  const textContent = result.content
    ?.find((block: any) => block.type === 'text')?.text || ''

  return {
    content: textContent,
    tokensIn,
    tokensOut,
    cost,
    model,
    tool_use: toolUse.length > 0 ? toolUse : undefined
  }
}

/**
 * Process streaming response from Claude API
 * 
 * @param response - Raw streaming response from callClaude
 * @param onChunk - Callback for each text chunk
 * @param onComplete - Callback when stream completes
 * 
 * Returns: { fullContent, tokensIn, tokensOut }
 */
export async function processStream(
  response: Response,
  onChunk: (text: string) => void,
  onComplete?: () => void
): Promise<{ fullContent: string; tokensIn: number; tokensOut: number }> {
  const reader = response.body!.getReader()
  const decoder = new TextDecoder()
  
  let fullContent = ''
  let tokensIn = 0
  let tokensOut = 0

  try {
    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      const chunk = decoder.decode(value)
      const lines = chunk.split('\n').filter(line => line.trim())

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6)

          if (data === '[DONE]') {
            if (onComplete) onComplete()
            return { fullContent, tokensIn, tokensOut }
          }

          try {
            const event = JSON.parse(data)

            // Track tokens from usage events
            if (event.type === 'message_start' && event.message?.usage) {
              tokensIn = event.message.usage.input_tokens || 0
            }

            if (event.type === 'message_delta' && event.usage) {
              tokensOut = event.usage.output_tokens || 0
            }

            // Extract content deltas
            if (event.type === 'content_block_delta' && event.delta?.text) {
              fullContent += event.delta.text
              onChunk(event.delta.text)
            }

          } catch (e) {
            console.error('[anthropic-client] Failed to parse SSE event:', e)
          }
        }
      }
    }
  } catch (error) {
    console.error('[anthropic-client] Streaming error:', error)
    throw error
  }

  if (onComplete) onComplete()
  return { fullContent, tokensIn, tokensOut }
}

/**
 * Build conversation history for multi-turn interactions
 * 
 * Used for tool calling: user → assistant (with tool_use) → user (with tool_result) → assistant
 */
export function buildConversationHistory(
  messages: ConversationMessage[]
): Array<{ role: string; content: any }> {
  return messages.map(msg => ({
    role: msg.role,
    content: msg.content
  }))
}

/**
 * Create tool result message for conversation history
 * 
 * After executing a tool, send result back to Claude
 */
export function createToolResultMessage(
  toolUseId: string,
  content: string
): { type: string; tool_use_id: string; content: string } {
  return {
    type: 'tool_result',
    tool_use_id: toolUseId,
    content
  }
}

/**
 * Create tool use content block for conversation history
 * 
 * Represents Claude's tool call in conversation
 */
export function createToolUseBlock(
  id: string,
  name: string,
  input: Record<string, any>
): { type: string; id: string; name: string; input: Record<string, any> } {
  return {
    type: 'tool_use',
    id,
    name,
    input
  }
}

/**
 * Get model pricing information
 */
export function getModelPricing(model: ClaudeModel): { input: number; output: number } {
  return MODEL_PRICING[model]
}

/**
 * Validate API key format
 */
export function validateApiKey(apiKey: string): boolean {
  return !!(apiKey && apiKey.startsWith('sk-ant-'))
}
