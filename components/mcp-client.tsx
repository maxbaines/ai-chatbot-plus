'use client';

import { useState } from 'react';
import { useSWRConfig } from 'swr';
import type { Session } from 'next-auth';
import { useSearchParams } from 'next/navigation';
import { MCPHeader } from './mcp-header';
import { MCPTabs } from './mcp-tabs';
import { deleteMCPServerAction, duplicateMCPServerAction, testConnectionAction, toggleMCPServerEnabledAction } from '@/app/(mcp-client)/actions';
import type { MCPServer } from '@/lib/db/schema';

// Client-side interface that matches what the UI components expect
interface ClientMCPServer {
  id: string;
  name: string;
  description?: string;
  url: string;
  type: 'sse' | 'stdio';
  command?: string;
  args?: string[];
  env?: Array<{ key: string; value: string }>;
  headers?: Array<{ key: string; value: string }>;
  status?: 'connected' | 'disconnected' | 'connecting' | 'error';
  errorMessage?: string;
  sandboxUrl?: string;
  enabled?: boolean;
  streaming?: boolean;
  createdAt: string;
  updatedAt: string;
}

// Transform database server to client server
const transformServer = (dbServer: MCPServer): ClientMCPServer => ({
  id: dbServer.id,
  name: dbServer.name,
  description: dbServer.description || undefined,
  url: dbServer.url,
  type: dbServer.type,
  command: dbServer.command || undefined,
  args: (dbServer.args as string[]) || [],
  env: (dbServer.env as Array<{ key: string; value: string }>) || [],
  headers: (dbServer.headers as Array<{ key: string; value: string }>) || [],
  status: dbServer.status || 'disconnected',
  errorMessage: dbServer.errorMessage || undefined,
  sandboxUrl: dbServer.sandboxUrl || undefined,
  enabled: dbServer.enabled,
  streaming: dbServer.streaming,
  createdAt: dbServer.createdAt.toISOString().split('T')[0],
  updatedAt: dbServer.updatedAt.toISOString().split('T')[0],
});

export function MCPClient({
  session,
  initialServers = [],
}: {
  session: Session;
  initialServers?: MCPServer[];
}) {
  const { mutate } = useSWRConfig();

  const searchParams = useSearchParams();
  const query = searchParams.get('query');
  const [servers, setServers] = useState<ClientMCPServer[]>(() =>
    initialServers.map(transformServer)
  );
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('all');

  const handleDeleteServer = async (serverId: string) => {
    try {
      const result = await deleteMCPServerAction(serverId);
      if (result.success) {
        setServers((prev) => prev.filter((s) => s.id !== serverId));
      }
    } catch (error) {
      console.error('Failed to delete server:', error);
    }
  };

  const handleDuplicateServer = async (server: ClientMCPServer) => {
    try {
      const newName = `${server.name} (Copy)`;
      const result = await duplicateMCPServerAction(server.id, newName);
      if (result.success && result.server) {
        // Add the new server to the current list (optimistic update)
        const newServer = transformServer(result.server);
        setServers((prev) => [...prev, newServer]);
      }
    } catch (error) {
      console.error('Failed to duplicate server:', error);
    }
  };

  const handleTestConnection = async (serverId: string) => {
    try {
      const result = await testConnectionAction(serverId);
      if (result.success && result.server) {
        // Update the server status optimistically
        setServers((prev) =>
          prev.map((s) =>
            s.id === serverId
              ? { 
                  ...s, 
                  status: result.server.status, 
                  errorMessage: result.server.errorMessage || undefined 
                }
              : s
          )
        );
      }
    } catch (error) {
      console.error('Failed to test connection:', error);
    }
  };

  const handleToggleEnabled = async (serverId: string, enabled: boolean) => {
    try {
      const result = await toggleMCPServerEnabledAction(serverId, enabled);
      if (result.success && result.server) {
        // Update the server enabled status optimistically
        setServers((prev) =>
          prev.map((s) =>
            s.id === serverId
              ? { 
                  ...s, 
                  enabled: result.server.enabled
                }
              : s
          )
        );
      }
    } catch (error) {
      console.error('Failed to toggle server enabled status:', error);
    }
  };

  // Filter servers based on search term first
  const searchFilteredServers = servers.filter(
    (server) =>
      server.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (server.description && server.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Then apply tab filtering
  const getTabFilteredServers = () => {
    switch (activeTab) {
      case 'connected':
        return searchFilteredServers.filter((s) => s.status === 'connected');
      case 'disconnected':
        return searchFilteredServers.filter((s) => s.status === 'disconnected' || s.status === 'error');
      case 'sse':
        return searchFilteredServers.filter((s) => s.type === 'sse');
      case 'stdio':
        return searchFilteredServers.filter((s) => s.type === 'stdio');
      case 'all':
      default:
        return searchFilteredServers;
    }
  };

  const finalFilteredServers = getTabFilteredServers();

  // Calculate server counts based on search-filtered servers (not tab-filtered)
  const serverCounts = {
    connected: searchFilteredServers.filter((s) => s.status === 'connected').length,
    disconnected: searchFilteredServers.filter((s) => s.status === 'disconnected' || s.status === 'error').length,
    sse: searchFilteredServers.filter((s) => s.type === 'sse').length,
    stdio: searchFilteredServers.filter((s) => s.type === 'stdio').length,
    all: searchFilteredServers.length,
  };

  return (
    <div className="flex flex-col min-w-0 h-dvh bg-background relative">
      <MCPHeader
        session={session}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        serverCounts={serverCounts}
      />
      <MCPTabs
        servers={finalFilteredServers}
        activeTab={activeTab}
        onDelete={handleDeleteServer}
        onDuplicate={handleDuplicateServer}
        onTestConnection={handleTestConnection}
        onToggleEnabled={handleToggleEnabled}
      />
    </div>
  );
}
