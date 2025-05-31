import { redirect } from 'next/navigation';
import { auth } from '@/app/(auth)/auth';
import { Metadata } from 'next';
import { MCPServerEdit } from '@/components/mcp-server-edit';

export const metadata: Metadata = {
  title: 'Chatbot+ Add MCP',
  description: 'Add a new MCP server configuration',
}

export default async function NewMCPServerPage() {
  const session = await auth();

  if (!session) {
    redirect('/api/auth/guest');
  }

  return (
    <MCPServerEdit
      session={session}
      mode="create"
    />
  );
}
