import { z } from 'zod';
import { allChatModels } from '@/lib/ai/models';

const textPartSchema = z.object({
  text: z.string().min(1).max(2000),
  type: z.enum(['text']),
});

export const postRequestBodySchema = z.object({
  id: z.string().uuid(),
  message: z.object({
    id: z.string().uuid(),
    createdAt: z.coerce.date(),
    role: z.enum(['user']),
    content: z.string().min(1).max(2000),
    parts: z.array(textPartSchema),
    experimental_attachments: z
      .array(
        z.object({
          url: z.string().url(),
          name: z.string().min(1).max(2000),
          contentType: z.enum(['image/png', 'image/jpg', 'image/jpeg']),
        }),
      )
      .optional(),
  }),
  selectedChatModel: z.string().min(1).refine(
    (value) => allChatModels.some(model => model.id === value),
    { message: "Invalid model ID - model not found in available models" }
  ),
  selectedVisibilityType: z.enum(['public', 'private']),
  mcpServers: z.array(z.object({
    url: z.string().url(),
    type: z.enum(['sse', 'stdio']),
    command: z.string().optional(),
    args: z.array(z.string()).optional(),
    env: z.array(z.object({
      key: z.string(),
      value: z.string(),
    })).optional(),
    headers: z.array(z.object({
      key: z.string(),
      value: z.string(),
    })).optional(),
    streaming: z.boolean().optional(),
  })).optional(),
});

export type PostRequestBody = z.infer<typeof postRequestBodySchema>;
