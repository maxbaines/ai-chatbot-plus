import { auth } from '@/app/(auth)/auth';
import { PromptEdit } from '@/components/prompt-edit';
import { getPromptAction } from '@/app/(prompt)/actions';
import { redirect, notFound } from 'next/navigation';

// Transform database prompt to client prompt
const transformPrompt = (dbPrompt: any) => ({
  id: dbPrompt.id,
  name: dbPrompt.name,
  description: dbPrompt.description,
  content: dbPrompt.content,
  type: dbPrompt.type,
  isDefault: dbPrompt.isDefault,
  createdAt: dbPrompt.createdAt.toISOString().split('T')[0],
  updatedAt: dbPrompt.updatedAt.toISOString().split('T')[0],
  usageCount: dbPrompt.usageCount,
});

export default async function EditPromptPage(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const { id } = params;
  
  const session = await auth();

  if (!session?.user) {
    redirect('/login');
  }

  const result = await getPromptAction(id);

  if (!result.success || !result.prompt) {
    notFound();
  }

  const prompt = transformPrompt(result.prompt);

  return (
    <PromptEdit
      prompt={prompt}
      isEditing={true}
      session={session}
    />
  );
}
