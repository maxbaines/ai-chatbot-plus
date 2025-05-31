import { redirect } from 'next/navigation';

import { auth } from '@/app/(auth)/auth';
import { Metadata } from 'next';
import { Prompt } from '@/components/prompt';
import { getPromptsAction } from '@/app/(prompt)/actions';

export const metadata: Metadata = {
  title: 'Chatbot+ Prompt Library',
  description: 'Manage and organize your prompts',
}

export default async function Page() {

  const session = await auth();

  if (!session) {
    redirect('/api/auth/guest');
  }

  // Load initial prompts on the server
  const initialPromptsResult = await getPromptsAction();
  const initialPrompts = initialPromptsResult.success ? initialPromptsResult.prompts : [];

  return (
      <Prompt
        session={session}
        initialPrompts={initialPrompts}
      />
  );
}
