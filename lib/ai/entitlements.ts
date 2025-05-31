import type { UserType } from '@/app/(auth)/auth';
import type { ChatModel } from './models';

interface Entitlements {
  maxMessagesPerDay: number;
  availableChatModelIds: Array<ChatModel['id']>;
}

export const entitlementsByUserType: Record<UserType, Entitlements> = {
  /*
   * For users without an account
   */
  guest: {
    maxMessagesPerDay: 2,
    availableChatModelIds: [
      // Default models
      'chat-model', 
      'xai-chat-model-reasoning',
      // Basic models from each provider
      'xai-grok-3-mini',
      'openai-gpt-3.5-turbo',
      'anthropic-claude-3-5-haiku-20241022',
      'google-gemini-1.0-pro',
      'google-gemini-1.5-flash',
      'mistral-small-latest',
      'togetherai-meta-llama-3.1-8b-instruct-turbo',
      'groq-llama-3.1-8b-instant',
    ],
  },

  /*
   * For users with an account
   */
  regular: {
    maxMessagesPerDay: 100,
    availableChatModelIds: [
      // Default models
      'chat-model', 
      'xai-chat-model-reasoning',
      'xai-chat-model-search',
      'openai-chat-model-search',
      // xAI models
      'xai-grok-3',
      'xai-grok-3-fast',
      'xai-grok-3-mini',
      'xai-grok-3-mini-fast',
      'xai-grok-2-1212',
      'xai-grok-2-vision-1212',
      'xai-grok-beta',
      'xai-grok-vision-beta',
      // OpenAI models
      'openai-gpt-4.1',
      'openai-gpt-4.1-mini',
      'openai-gpt-4.1-nano',
      'openai-gpt-4o',
      'openai-gpt-4o-mini',
      'openai-gpt-4-turbo',
      'openai-o3-mini',
      'openai-o3',
      'openai-o4-mini',
      'openai-o1',
      'openai-o1-mini',
      'openai-o1-preview',
      // Anthropic models
      'anthropic-claude-4-opus-20250514',
      'anthropic-claude-4-sonnet-20250514',
      'anthropic-claude-3-7-sonnet-20250219',
      'anthropic-claude-3-5-sonnet-20241022',
      'anthropic-claude-3-5-sonnet-20240620',
      'anthropic-claude-3-5-haiku-20241022',
      // Google models
      'google-gemini-2.0-flash-exp',
      'google-gemini-1.5-pro',
      'google-gemini-1.5-flash',
      // Mistral models
      'mistral-pixtral-large-latest',
      'mistral-large-latest',
      'mistral-small-latest',
      'mistral-pixtral-12b-2409',
      // Together.ai models
      'togetherai-meta-llama-3.1-8b-instruct-turbo',
      'togetherai-meta-llama-3.1-70b-instruct-turbo',
      'togetherai-mistralai-mixtral-8x7b-instruct-v0.1',
      'togetherai-codellama-34b-instruct',
      // Groq models
      'groq-meta-llama-llama-4-scout-17b-16e-instruct',
      'groq-llama-3.3-70b-versatile',
      'groq-llama-3.1-8b-instant',
      'groq-mixtral-8x7b-32768',
      'groq-gemma2-9b-it',
       // Vercel models
       'vercel-v0-1.0-md',
    ],
  },

  /*
   * TODO: For users with an account and a paid membership
   * Note: Premium tier would need to be added to UserType first
   */
};
