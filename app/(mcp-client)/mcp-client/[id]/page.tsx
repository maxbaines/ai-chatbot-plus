import { redirect } from 'next/navigation';
import { auth } from '@/app/(auth)/auth';
import { Metadata } from 'next';
import { MCPServerEdit } from '@/components/mcp-server-edit';
import { getMCPServerAction } from '@/app/(mcp-client)/actions';

export const metadata: Metadata = {
  title: 'Chatbot+ Edit MCP',
  description: 'Edit MCP server configuration',
}

export default async function EditMCPServerPage(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const { id } = params;
  const session = await auth();

  if (!session) {
    redirect('/api/auth/guest');
  }

  const serverResult = await getMCPServerAction(id);
  
  if (!serverResult.success || !serverResult.server) {
    redirect('/mcp-client');
  }

  return (
    <MCPServerEdit
      session={session}
      server={serverResult.server}
      mode="edit"
    />
  );
}
