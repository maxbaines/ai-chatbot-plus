import {
  customProvider,
  extractReasoningMiddleware,
  defaultSettingsMiddleware,
  wrapLanguageModel,
} from 'ai';
import { xai } from '@ai-sdk/xai';
import { openai } from '@ai-sdk/openai';
import { anthropic } from '@ai-sdk/anthropic';
import { google } from '@ai-sdk/google';
import { mistral } from '@ai-sdk/mistral';
import { togetherai } from '@ai-sdk/togetherai';
import { groq } from '@ai-sdk/groq';
import { isTestEnvironment } from '../constants';
import {
  artifactModel,
  chatModel,
  reasoningModel,
  titleModel,
} from './models.test';

// Model mapping for all providers
const getLanguageModel = (modelId: string) => {

  // Default models
  if (modelId === 'chat-model') return xai('grok-2-vision-1212');
  
  if (modelId === 'xai-chat-model-reasoning') {
    return wrapLanguageModel({
      model: xai('grok-3-mini'),
      middleware: extractReasoningMiddleware({ tagName: 'think' }),
    });
  }

  if (modelId === 'xai-chat-model-search') {
    return wrapLanguageModel({
      model: xai('grok-3'),
      middleware: defaultSettingsMiddleware({
        settings: {
          // note: use providerMetadata instead of providerOptions here:
          providerMetadata: {
            xai: {
              search_parameters: {
                mode: "auto",
                return_citations: true,
                max_search_results: 20,
                sources: [
                  { type: "web" },
                  { type: "x" },
                  { type: "news" }
                ]
              }
            }
          },
        },
      })
    })
  }

  if (modelId === 'openai-chat-model-search') {
    return  openai('gpt-4o-search-preview')
  }

  // xAI models
  if (modelId === 'xai-grok-3') return xai('grok-3');
  if (modelId === 'xai-grok-3-fast') return xai('grok-3-fast');
  if (modelId === 'xai-grok-3-mini') return xai('grok-3-mini');
  if (modelId === 'xai-grok-3-mini-fast') return xai('grok-3-mini-fast');
  if (modelId === 'xai-grok-2-1212') return xai('grok-2-1212');
  if (modelId === 'xai-grok-2-vision-1212') return xai('grok-2-vision-1212');
  if (modelId === 'xai-grok-beta') return xai('grok-beta');
  if (modelId === 'xai-grok-vision-beta') return xai('grok-vision-beta');

  // OpenAI models
  if (modelId === 'openai-gpt-4.1') return openai('gpt-4.1'); // Fallback to gpt-4o until 4.1 is available
  if (modelId === 'openai-gpt-4.1-mini') return openai('gpt-4o-mini'); // Fallback to gpt-4o-mini
  if (modelId === 'openai-gpt-4.1-nano') return openai('gpt-4o-mini'); // Fallback to gpt-4o-mini
  if (modelId === 'openai-gpt-4o') return openai('gpt-4o');
  if (modelId === 'openai-gpt-4o-mini') return openai('gpt-4o-mini');
  if (modelId === 'openai-gpt-4-turbo') return openai('gpt-4-turbo');
  if (modelId === 'openai-o3-mini') return openai('o1-mini'); // Fallback to o1-mini until o3-mini is available
  if (modelId === 'openai-o3') return openai('o1'); // Fallback to o1 until o3 is available
  if (modelId === 'openai-o4-mini') return openai('o1-mini'); // Fallback to o1-mini until o4-mini is available
  if (modelId === 'openai-o1') return openai('o1');
  if (modelId === 'openai-o1-mini') return openai('o1-mini');
  if (modelId === 'openai-o1-preview') return openai('o1-preview');

  // Anthropic models
  if (modelId === 'anthropic-claude-4-opus-20250514') return anthropic('claude-3-5-sonnet-20241022'); // Fallback until Claude 4 is available
  if (modelId === 'anthropic-claude-4-sonnet-20250514') return anthropic('claude-3-5-sonnet-20241022'); // Fallback until Claude 4 is available
  if (modelId === 'anthropic-claude-3-7-sonnet-20250219') return anthropic('claude-3-5-sonnet-20241022'); // Fallback until Claude 3.7 is available
  if (modelId === 'anthropic-claude-3-5-sonnet-20241022') return anthropic('claude-3-5-sonnet-20241022');
  if (modelId === 'anthropic-claude-3-5-sonnet-20240620') return anthropic('claude-3-5-sonnet-20240620');
  if (modelId === 'anthropic-claude-3-5-haiku-20241022') return anthropic('claude-3-5-haiku-20241022');

  // Google models
  if (modelId === 'google-gemini-2.0-flash-exp') return google('gemini-1.5-flash'); // Fallback until 2.0 is available
  if (modelId === 'google-gemini-1.5-pro') return google('gemini-1.5-pro');
  if (modelId === 'google-gemini-1.5-flash') return google('gemini-1.5-flash');

  // Mistral models
  if (modelId === 'mistral-pixtral-large-latest') return mistral('pixtral-large-latest');
  if (modelId === 'mistral-large-latest') return mistral('mistral-large-latest');
  if (modelId === 'mistral-small-latest') return mistral('mistral-small-latest');
  if (modelId === 'mistral-pixtral-12b-2409') return mistral('pixtral-12b-2409');

  // Together.ai models
  if (modelId === 'togetherai-meta-llama-3.1-70b-instruct-turbo') return togetherai('meta-llama/Meta-Llama-3.1-70B-Instruct-Turbo');
  if (modelId === 'togetherai-meta-llama-3.1-8b-instruct-turbo') return togetherai('meta-llama/Meta-Llama-3.1-8B-Instruct-Turbo');
  if (modelId === 'togetherai-mistralai-mixtral-8x7b-instruct-v0.1') return togetherai('mistralai/Mixtral-8x7B-Instruct-v0.1');
  if (modelId === 'togetherai-codellama-34b-instruct') return togetherai('codellama/CodeLlama-34b-Instruct-hf');

  // Groq models
  if (modelId === 'groq-meta-llama-llama-4-scout-17b-16e-instruct') return groq('meta-llama/llama-4-scout-17b-16e-instruct'); // May need adjustment when available
  if (modelId === 'groq-llama-3.3-70b-versatile') return groq('llama-3.3-70b-versatile');
  if (modelId === 'groq-llama-3.1-8b-instant') return groq('llama-3.1-8b-instant');
  if (modelId === 'groq-mixtral-8x7b-32768') return groq('mixtral-8x7b-32768');
  if (modelId === 'groq-gemma2-9b-it') return groq('gemma2-9b-it');
  
  // Vercel models (using OpenAI as fallback since Vercel doesn't have AI SDK provider yet)
  if (modelId === 'vercel-v0-1.0-md') return openai('gpt-4o'); // Fallback to GPT-4o

  // Default fallback
  return xai('xai-grok-2-1212');
};

export const myProvider = isTestEnvironment
  ? customProvider({
      languageModels: {
        'chat-model': chatModel,
        'xai-chat-model-reasoning': reasoningModel,
        'title-model': titleModel,
        'artifact-model': artifactModel,
      },
    })
  : customProvider({
    languageModels: {
      // Default models
      'chat-model': getLanguageModel('chat-model'),
      'xai-chat-model-reasoning': getLanguageModel('xai-chat-model-reasoning'),
      'xai-chat-model-search': getLanguageModel('xai-chat-model-search'),
      'title-model': xai('grok-3'),
      'artifact-model': xai('grok-3'),

      // xAI models
      'xai-grok-3': getLanguageModel('xai-grok-3'),
      'xai-grok-3-fast': getLanguageModel('xai-grok-3-fast'),
      'xai-grok-3-mini': getLanguageModel('xai-grok-3-mini'),
      'xai-grok-3-mini-fast': getLanguageModel('xai-grok-3-mini-fast'),
      'xai-grok-2-1212': getLanguageModel('xai-grok-2-1212'),
      'xai-grok-2-vision-1212': getLanguageModel('xai-grok-2-vision-1212'),
      'xai-grok-beta': getLanguageModel('xai-grok-beta'),
      'xai-grok-vision-beta': getLanguageModel('xai-grok-vision-beta'),

      // Vercel models
      'vercel-v0-1.0-md': getLanguageModel('vercel-v0-1.0-md'),

      // OpenAI models
      'openai-chat-model-search':getLanguageModel('openai-chat-model-search'),
      'openai-gpt-4.1': getLanguageModel('openai-gpt-4.1'),
      'openai-gpt-4.1-mini': getLanguageModel('openai-gpt-4.1-mini'),
      'openai-gpt-4.1-nano': getLanguageModel('openai-gpt-4.1-nano'),
      'openai-gpt-4o': getLanguageModel('openai-gpt-4o'),
      'openai-gpt-4o-mini': getLanguageModel('openai-gpt-4o-mini'),
      'openai-gpt-4-turbo': getLanguageModel('openai-gpt-4-turbo'),
      'openai-o3-mini': getLanguageModel('openai-o3-mini'),
      'openai-o3': getLanguageModel('openai-o3'),
      'openai-o4-mini': getLanguageModel('openai-o4-mini'),
      'openai-o1': getLanguageModel('openai-o1'),
      'openai-o1-mini': getLanguageModel('openai-o1-mini'),
      'openai-o1-preview': getLanguageModel('openai-o1-preview'),

      // Anthropic models
      'anthropic-claude-4-opus-20250514': getLanguageModel('anthropic-claude-4-opus-20250514'),
      'anthropic-claude-4-sonnet-20250514': getLanguageModel('anthropic-claude-4-sonnet-20250514'),
      'anthropic-claude-3-7-sonnet-20250219': getLanguageModel('anthropic-claude-3-7-sonnet-20250219'),
      'anthropic-claude-3-5-sonnet-20241022': getLanguageModel('anthropic-claude-3-5-sonnet-20241022'),
      'anthropic-claude-3-5-sonnet-20240620': getLanguageModel('anthropic-claude-3-5-sonnet-20240620'),
      'anthropic-claude-3-5-haiku-20241022': getLanguageModel('anthropic-claude-3-5-haiku-20241022'),

      // Google models
      'google-gemini-2.0-flash-exp': getLanguageModel('google-gemini-2.0-flash-exp'),
      'google-gemini-1.5-pro': getLanguageModel('google-gemini-1.5-pro'),
      'google-gemini-1.5-flash': getLanguageModel('google-gemini-1.5-flash'),

      // Mistral models
      'mistral-pixtral-large-latest': getLanguageModel('mistral-pixtral-large-latest'),
      'mistral-large-latest': getLanguageModel('mistral-large-latest'),
      'mistral-small-latest': getLanguageModel('mistral-small-latest'),
      'mistral-pixtral-12b-2409': getLanguageModel('mistral-pixtral-12b-2409'),

      // Together.ai models
      'togetherai-meta-llama-3.1-70b-instruct-turbo': getLanguageModel('togetherai-meta-llama-3.1-70b-instruct-turbo'),
      'togetherai-meta-llama-3.1-8b-instruct-turbo': getLanguageModel('togetherai-meta-llama-3.1-8b-instruct-turbo'),
      'togetherai-mistralai-mixtral-8x7b-instruct-v0.1': getLanguageModel('togetherai-mistralai-mixtral-8x7b-instruct-v0.1'),
      'togetherai-codellama-34b-instruct': getLanguageModel('togetherai-codellama-34b-instruct'),

      // Groq models
      'groq-meta-llama-llama-4-scout-17b-16e-instruct': getLanguageModel('groq-meta-llama-llama-4-scout-17b-16e-instruct'),
      'groq-llama-3.3-70b-versatile': getLanguageModel('groq-llama-3.3-70b-versatile'),
      'groq-llama-3.1-8b-instant': getLanguageModel('groq-llama-3.1-8b-instant'),
      'groq-mixtral-8x7b-32768': getLanguageModel('groq-mixtral-8x7b-32768'),
      'groq-gemma2-9b-it': getLanguageModel('groq-gemma2-9b-it'),
    },
      imageModels: {
        'small-model': xai.image('grok-2-image'),
      },
    });
