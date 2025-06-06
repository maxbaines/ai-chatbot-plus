'use server';

import { auth } from '@/app/(auth)/auth';
import {
  createMCPServer,
  getMCPServersByUserId,
  getMCPServerById,
  updateMCPServer,
  deleteMCPServer,
  duplicateMCPServer,
  updateMCPServerStatus,
  updateMCPServerEnabled,
} from '@/lib/db/queries';
import { redirect } from 'next/navigation';
import { z } from 'zod';

const mcpServerSchema = z.object({
  name: z.string().min(1, 'Name is required').max(255, 'Name too long'),
  description: z.string().optional(),
  url: z.string().url('Invalid URL'),
  type: z.enum(['sse', 'stdio']),
  command: z.string().optional(),
  args: z.array(z.string()).optional(),
  env: z.array(z.object({
    key: z.string(),
    value: z.string()
  })).optional(),
  headers: z.array(z.object({
    key: z.string(),
    value: z.string()
  })).optional(),
  sandboxUrl: z.string().url().optional(),
  streaming: z.boolean().optional(),
});

export async function createMCPServerAction(formData: FormData) {
  const session = await auth();

  if (!session?.user?.id) {
    redirect('/login');
  }

  try {
    const data = {
      name: formData.get('name') as string,
      description: formData.get('description') as string || undefined,
      url: formData.get('url') as string,
      type: formData.get('type') as 'sse' | 'stdio',
      command: formData.get('command') as string || undefined,
      args: formData.get('args') ? JSON.parse(formData.get('args') as string) : undefined,
      env: formData.get('env') ? JSON.parse(formData.get('env') as string) : undefined,
      headers: formData.get('headers') ? JSON.parse(formData.get('headers') as string) : undefined,
      sandboxUrl: formData.get('sandboxUrl') as string || undefined,
      streaming: formData.get('streaming') === 'true',
    };

    const validatedData = mcpServerSchema.parse(data);

    const [newServer] = await createMCPServer({
      ...validatedData,
      userId: session.user.id,
    });

    return { success: true, server: newServer };
  } catch (error) {
    console.error('Failed to create MCP server:', error);
    return { success: false, error: 'Failed to create MCP server' };
  }
}

export async function updateMCPServerAction(id: string, formData: FormData) {
  const session = await auth();

  if (!session?.user?.id) {
    redirect('/login');
  }

  try {
    const data = {
      name: formData.get('name') as string,
      description: formData.get('description') as string || undefined,
      url: formData.get('url') as string,
      type: formData.get('type') as 'sse' | 'stdio',
      command: formData.get('command') as string || undefined,
      args: formData.get('args') ? JSON.parse(formData.get('args') as string) : undefined,
      env: formData.get('env') ? JSON.parse(formData.get('env') as string) : undefined,
      headers: formData.get('headers') ? JSON.parse(formData.get('headers') as string) : undefined,
      sandboxUrl: formData.get('sandboxUrl') as string || undefined,
      streaming: formData.get('streaming') === 'true',
    };

    const validatedData = mcpServerSchema.parse(data);

    // First check if the server exists and belongs to the user
    const existingServer = await getMCPServerById({ id });
    if (!existingServer || existingServer.userId !== session.user.id) {
      return { success: false, error: 'Server not found' };
    }

    const [updatedServer] = await updateMCPServer({
      id,
      ...validatedData,
    });

    return { success: true, server: updatedServer };
  } catch (error) {
    console.error('Failed to update MCP server:', error);
    return { success: false, error: 'Failed to update MCP server' };
  }
}

export async function deleteMCPServerAction(id: string) {
  const session = await auth();

  if (!session?.user?.id) {
    redirect('/login');
  }

  try {
    // First check if the server exists and belongs to the user
    const existingServer = await getMCPServerById({ id });
    if (!existingServer || existingServer.userId !== session.user.id) {
      return { success: false, error: 'Server not found' };
    }

    await deleteMCPServer({ id });
    return { success: true };
  } catch (error) {
    console.error('Failed to delete MCP server:', error);
    return { success: false, error: 'Failed to delete MCP server' };
  }
}

export async function duplicateMCPServerAction(id: string, newName: string) {
  const session = await auth();

  if (!session?.user?.id) {
    redirect('/login');
  }

  try {
    // First check if the server exists and belongs to the user
    const existingServer = await getMCPServerById({ id });
    if (!existingServer || existingServer.userId !== session.user.id) {
      return { success: false, error: 'Server not found' };
    }

    const [duplicatedServer] = await duplicateMCPServer({
      id,
      userId: session.user.id,
      newName,
    });

    return { success: true, server: duplicatedServer };
  } catch (error) {
    console.error('Failed to duplicate MCP server:', error);
    return { success: false, error: 'Failed to duplicate MCP server' };
  }
}

export async function getMCPServersAction(searchTerm?: string, type?: string, status?: string) {
  const session = await auth();

  if (!session?.user?.id) {
    redirect('/login');
  }

  try {
    const servers = await getMCPServersByUserId({
      userId: session.user.id,
      searchTerm,
      type: type as 'sse' | 'stdio' | 'all',
      status: status as 'connected' | 'disconnected' | 'connecting' | 'error' | 'all',
    });

    return { success: true, servers };
  } catch (error) {
    console.error('Failed to get MCP servers:', error);
    return { success: false, error: 'Failed to get MCP servers', servers: [] };
  }
}

export async function getMCPServerAction(id: string) {
  const session = await auth();

  if (!session?.user?.id) {
    redirect('/login');
  }

  try {
    const server = await getMCPServerById({ id });

    if (!server || server.userId !== session.user.id) {
      return { success: false, error: 'Server not found' };
    }

    return { success: true, server };
  } catch (error) {
    console.error('Failed to get MCP server:', error);
    return { success: false, error: 'Failed to get MCP server' };
  }
}

export async function testConnectionAction(id: string) {
  const session = await auth();

  if (!session?.user?.id) {
    redirect('/login');
  }

  try {
    // First check if the server exists and belongs to the user
    const existingServer = await getMCPServerById({ id });
    if (!existingServer || existingServer.userId !== session.user.id) {
      return { success: false, error: 'Server not found' };
    }

    // Update status to connecting
    await updateMCPServerStatus({
      id,
      status: 'connecting',
    });

    // Mock connection test - in real implementation, this would actually test the connection
    // For now, we'll simulate a connection test with a random success/failure
    setTimeout(async () => {
      const success =true
      await updateMCPServerStatus({
        id,
        status: success ? 'connected' : 'error',
        errorMessage: success ? undefined : 'Connection timeout',
      });
    }, 2000);

    const [updatedServer] = await updateMCPServerStatus({
      id,
      status: 'connecting',
    });

    return { success: true, server: updatedServer };
  } catch (error) {
    console.error('Failed to test connection:', error);
    return { success: false, error: 'Failed to test connection' };
  }
}

export async function toggleMCPServerEnabledAction(id: string, enabled: boolean) {
  const session = await auth();

  if (!session?.user?.id) {
    redirect('/login');
  }

  try {
    // First check if the server exists and belongs to the user
    const existingServer = await getMCPServerById({ id });
    if (!existingServer || existingServer.userId !== session.user.id) {
      return { success: false, error: 'Server not found' };
    }

    const [updatedServer] = await updateMCPServerEnabled({
      id,
      enabled,
    });

    return { success: true, server: updatedServer };
  } catch (error) {
    console.error('Failed to toggle MCP server enabled status:', error);
    return { success: false, error: 'Failed to toggle server enabled status' };
  }
}

// Removed getEnabledMCPServersAction - enabled servers are now derived from all servers in the context

export async function updateMCPServerStatusAction(
  id: string,
  status: 'connected' | 'disconnected' | 'connecting' | 'error',
  errorMessage?: string
) {
  const session = await auth();

  if (!session?.user?.id) {
    redirect('/login');
  }

  try {
    // First check if the server exists and belongs to the user
    const existingServer = await getMCPServerById({ id });
    if (!existingServer || existingServer.userId !== session.user.id) {
      return { success: false, error: 'Server not found' };
    }

    const [updatedServer] = await updateMCPServerStatus({
      id,
      status,
      errorMessage,
    });

    return { success: true, server: updatedServer };
  } catch (error) {
    console.error('Failed to update MCP server status:', error);
    return { success: false, error: 'Failed to update MCP server status' };
  }
}
