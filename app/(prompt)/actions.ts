'use server';

import { auth } from '@/app/(auth)/auth';
import {
  createPrompt,
  getPromptsByUserId,
  getPromptById,
  updatePrompt,
  softDeletePrompt,
  duplicatePrompt,
  seedDefaultPromptsForUser,
} from '@/lib/db/queries';
import { redirect } from 'next/navigation';
import { z } from 'zod';

const promptSchema = z.object({
  name: z.string().min(1, 'Name is required').max(255, 'Name too long'),
  description: z.string().min(1, 'Description is required'),
  content: z.string().min(1, 'Content is required'),
  type: z.enum(['chat', 'code', 'name', 'custom']),
});

export async function createPromptAction(formData: FormData) {
  const session = await auth();

  if (!session?.user?.id) {
    redirect('/login');
  }

  try {
    const data = {
      name: formData.get('name') as string,
      description: formData.get('description') as string,
      content: formData.get('content') as string,
      type: formData.get('type') as 'chat' | 'code' | 'name' | 'custom',
    };

    const validatedData = promptSchema.parse(data);

    const [newPrompt] = await createPrompt({
      ...validatedData,
      userId: session.user.id,
    });

    return { success: true, prompt: newPrompt };
  } catch (error) {
    console.error('Failed to create prompt:', error);
    return { success: false, error: 'Failed to create prompt' };
  }
}

export async function updatePromptAction(id: string, formData: FormData) {
  const session = await auth();

  if (!session?.user?.id) {
    redirect('/login');
  }

  try {
    const data = {
      name: formData.get('name') as string,
      description: formData.get('description') as string,
      content: formData.get('content') as string,
      type: formData.get('type') as 'chat' | 'code' | 'name' | 'custom',
    };

    const validatedData = promptSchema.parse(data);

    const [updatedPrompt] = await updatePrompt({
      id,
      ...validatedData,
    });

    return { success: true, prompt: updatedPrompt };
  } catch (error) {
    console.error('Failed to update prompt:', error);
    return { success: false, error: 'Failed to update prompt' };
  }
}

export async function deletePromptAction(id: string) {
  const session = await auth();

  if (!session?.user?.id) {
    redirect('/login');
  }

  try {
    await softDeletePrompt({ id });
    return { success: true };
  } catch (error) {
    console.error('Failed to delete prompt:', error);
    return { success: false, error: 'Failed to delete prompt' };
  }
}

export async function duplicatePromptAction(id: string, newName: string) {
  const session = await auth();

  if (!session?.user?.id) {
    redirect('/login');
  }

  try {
    const [duplicatedPrompt] = await duplicatePrompt({
      id,
      userId: session.user.id,
      newName,
    });

    return { success: true, prompt: duplicatedPrompt };
  } catch (error) {
    console.error('Failed to duplicate prompt:', error);
    return { success: false, error: 'Failed to duplicate prompt' };
  }
}

export async function getPromptsAction(searchTerm?: string, type?: string) {
  const session = await auth();

  if (!session?.user?.id) {
    redirect('/login');
  }

  try {
    const prompts = await getPromptsByUserId({
      userId: session.user.id,
      searchTerm,
      type: type as 'chat' | 'code' | 'name' | 'custom' | 'all',
    });

    return { success: true, prompts };
  } catch (error) {
    console.error('Failed to get prompts:', error);
    return { success: false, error: 'Failed to get prompts', prompts: [] };
  }
}

export async function getPromptAction(id: string) {
  const session = await auth();

  if (!session?.user?.id) {
    redirect('/login');
  }

  try {
    const prompt = await getPromptById({ id });

    if (!prompt) {
      return { success: false, error: 'Prompt not found' };
    }

    // Ensure user owns the prompt
    if (prompt.userId !== session.user.id) {
      return { success: false, error: 'Unauthorized' };
    }

    return { success: true, prompt };
  } catch (error) {
    console.error('Failed to get prompt:', error);
    return { success: false, error: 'Failed to get prompt' };
  }
}
