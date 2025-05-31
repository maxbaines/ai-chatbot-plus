"use client"

import { MCPServerCard } from "./mcp-server-card"

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

interface MCPTabsProps {
  servers: ClientMCPServer[]
  activeTab: string
  onDelete: (id: string) => void
  onDuplicate: (server: ClientMCPServer) => void
  onTestConnection: (id: string) => void
  onToggleEnabled: (id: string, enabled: boolean) => void
}

export function MCPTabs({ servers, activeTab, onDelete, onDuplicate, onTestConnection, onToggleEnabled }: MCPTabsProps) {
  return (
    <div className="px-2 mt-4">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {servers.map((server) => (
          <MCPServerCard 
            key={server.id} 
            server={server} 
            onDelete={onDelete} 
            onDuplicate={onDuplicate}
            onTestConnection={onTestConnection}
            onToggleEnabled={onToggleEnabled}
          />
        ))}
      </div>
    </div>
  )
}
