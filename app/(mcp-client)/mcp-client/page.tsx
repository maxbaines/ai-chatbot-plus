import { redirect } from 'next/navigation';

import { auth } from '@/app/(auth)/auth';
import { Metadata } from 'next';
import { MCPClient } from '@/components/mcp-client';
import { getMCPServersAction } from '@/app/(mcp-client)/actions';

export const metadata: Metadata = {
  title: 'Chatbot+ MCP Client',
  description: 'Manage and configure your MCP servers',
}

export default async function MCPClientPage() {

  const session = await auth();

  if (!session) {
    redirect('/api/auth/guest');
  }

  // Load initial servers on the server
  const initialServersResult = await getMCPServersAction();
  const initialServers = initialServersResult.success ? initialServersResult.servers : [];

  return (
      <MCPClient
        session={session}
        initialServers={initialServers}
      />
  );
}
