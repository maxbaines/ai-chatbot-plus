import { auth } from '@/app/(auth)/auth';
import { PromptEdit } from '@/components/prompt-edit';
import { redirect } from 'next/navigation';

export default async function NewPromptPage() {
  const session = await auth();

  if (!session?.user) {
    redirect('/login');
  }

  return (
    <PromptEdit
      isEditing={false}
      session={session}
    />
  );
}
