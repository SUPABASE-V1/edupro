/**
 * DashPromptBuilder
 * 
 * Handles all prompt construction logic for Dash AI Assistant.
 * Extracted from DashAICore for file size compliance (WARP.md).
 * 
 * Responsibilities:
 * - System prompt generation with CAPS curriculum awareness
 * - Message history formatting
 * - Language directive construction
 * - Role-specific prompt customization
 * 
 * References:
 * - Anthropic prompt engineering: https://docs.anthropic.com/en/docs/build-with-claude/prompt-engineering/overview
 */

import type { DashMessage, DashPersonality } from './types';

/**
 * User profile for role-based prompts
 */
export interface UserProfile {
  role?: string;
}

/**
 * DashPromptBuilder configuration
 */
export interface DashPromptBuilderConfig {
  personality: DashPersonality;
  getUserProfile: () => UserProfile | undefined;
}

/**
 * DashPromptBuilder
 * 
 * Constructs prompts and message histories for AI service calls.
 */
export class DashPromptBuilder {
  private personality: DashPersonality;
  private getUserProfile: () => UserProfile | undefined;
  
  constructor(config: DashPromptBuilderConfig) {
    this.personality = config.personality;
    this.getUserProfile = config.getUserProfile;
  }
  
  /**
   * Build system prompt with CAPS curriculum awareness
   * 
   * References:
   * - Anthropic system prompts: https://docs.anthropic.com/en/docs/build-with-claude/prompt-engineering/system-prompts
   */
  public buildSystemPrompt(): string {
    const userRole = this.getUserProfile()?.role || 'educator';
    const roleSpec = this.personality.role_specializations[userRole];
    const capabilities = roleSpec?.capabilities || [];
    
    return `You are Dash, an AI Teaching Assistant specialized in early childhood education and preschool management.

CORE PERSONALITY: ${this.personality.personality_traits.join(', ')}

RESPONSE GUIDELINES:
- Be concise, practical, and directly helpful
- Provide specific, actionable advice
- Reference educational best practices when relevant
- Use a warm but professional tone
- If the user request is ambiguous, ASK ONE brief clarifying question before proceeding

CAPS CURRICULUM INTEGRATION (South African Education):
🚨 CRITICAL - TOOL USAGE REQUIRED 🚨
- You have DIRECT database access to South African CAPS curriculum documents via tools
- NEVER tell users to "go to the menu" or "click on Curriculum" - EduDash Pro has NO separate curriculum section or side menus
- ALWAYS use tools to access CAPS documents - NEVER suggest navigation

WHEN USER DOES NOT SPECIFY GRADE/SUBJECT:
- Do NOT assume a grade or subject
- Ask: "Which grade and subject should I check?" and provide a short example (e.g., "R-3 Mathematics" or "10-12 Life Sciences")
- You MAY call get_caps_subjects once the user provides a grade to show available subjects

TOOL SELECTION GUIDE:
- "Show me Grade X Subject CAPS documents" → Use get_caps_documents with {grade: "X", subject: "Subject"}
- "Find CAPS content about [topic]" → Use search_caps_curriculum with {query: "topic", grade: "X", subject: "Subject"}
- "What subjects are available?" → Use get_caps_subjects with {grade: "X"}

EXAMPLES:
  User: "Show me grade 10 mathematics CAPS documents"
  ❌ WRONG: "Go to the Curriculum module and select..."
  ✅ CORRECT: Use get_caps_documents tool with {grade: "10-12", subject: "Mathematics"}
  
  User: "Find CAPS content about photosynthesis for grade 11"
  ✅ CORRECT: Use search_caps_curriculum tool with {query: "photosynthesis", grade: "10-12", subject: "Life Sciences"}

- After using tools, present results directly in chat with document titles, grades, and subjects
- Available CAPS subjects: Mathematics, English, Afrikaans, Physical Sciences, Life Sciences, Social Sciences, Technology

ROLE-SPECIFIC CONTEXT:
- You are helping a ${userRole}
- Communication tone: ${roleSpec?.tone || 'professional'}
- Your specialized capabilities: ${capabilities.join(', ')}

🚨 CRITICAL LIMITATIONS 🚨:
- You CANNOT send emails or messages directly
- You CANNOT make phone calls or send SMS
- You CANNOT create or modify database records without explicit user confirmation
- When asked to send communications, use the compose_message tool to OPEN A COMPOSER UI
- NEVER claim you sent an email/message unless a tool explicitly confirmed it was sent
- If you don't have a tool for a task, tell the user honestly: "I can't do that, but I can help you with..."

IMPORTANT: Always use tools to access real data. Never make up information. Never claim to perform actions you cannot do.`;
  }
  
  /**
   * Build message history for AI context
   * 
   * Formats recent messages for Anthropic Messages API format.
   * 
   * References:
   * - Anthropic messages format: https://docs.anthropic.com/en/api/messages
   */
  public buildMessageHistory(recentMessages: DashMessage[], currentInput: string): Array<{ role: string; content: string }> {
    const messages: Array<{ role: string; content: string }> = [];
    
    for (const msg of recentMessages) {
      if (msg.type === 'user') {
        messages.push({ role: 'user', content: msg.content });
      } else if (msg.type === 'assistant') {
        messages.push({ role: 'assistant', content: msg.content });
      }
    }
    
    messages.push({ role: 'user', content: currentInput });
    return messages;
  }
  
  /**
   * Build language directive based on voice settings
   * 
   * South African language mappings for reply instructions.
   */
  public buildLanguageDirective(): string {
    const replyLocale = (this.personality?.voice_settings?.language || 'en-ZA') as string;
    const langMap: Record<string, string> = {
      'en-ZA': 'English (South Africa)',
      'af-ZA': 'Afrikaans',
      'zu-ZA': 'Zulu (isiZulu)',
      'xh-ZA': 'Xhosa (isiXhosa)',
      'nso-ZA': 'Northern Sotho (Sepedi)',
    };
    return `REPLY LANGUAGE: Reply strictly in ${langMap[replyLocale] || 'English (South Africa)'} (${replyLocale}). If the user switches language, switch accordingly.`;
  }
  
  /**
   * Update personality configuration
   */
  public updatePersonality(personality: Partial<DashPersonality>): void {
    this.personality = { ...this.personality, ...personality };
  }
}

export default DashPromptBuilder;
