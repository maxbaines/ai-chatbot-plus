"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { 
  getMCPServersAction, 
  getEnabledMCPServersAction,
  toggleMCPServerEnabledAction,
  updateMCPServerStatusAction
} from "@/app/(mcp-client)/actions";
import type { MCPServer } from "@/lib/db/schema";

// Mock sandbox functions
const startSandbox = async ({ id, command, args, env }: {
  id: string;
  command: string;
  args: string[];
  env?: Array<{ key: string; value: string }>;
}) => {
  // Mock implementation - in real scenario this would start a sandbox
  console.log(`Mock: Starting sandbox for ${id} with command: ${command}`, { args, env });
  
  // Simulate some delay
  await new Promise(resolve => setTimeout(resolve, 1));
  
  // Return a mock URL
  return {
    url: `http://localhost:${3000 + Math.floor(Math.random() * 1000)}/mcp`
  };
};

const stopSandbox = async (id: string) => {
  // Mock implementation - in real scenario this would stop a sandbox
  console.log(`Mock: Stopping sandbox for ${id}`);
  
  // Simulate some delay
  await new Promise(resolve => setTimeout(resolve, 1));
  
  return { success: true };
};

// Define types for MCP server
export interface KeyValuePair {
  key: string;
  value: string;
}

export type ServerStatus = 'disconnected' | 'connecting' | 'connected' | 'error';

// Type for processed MCP server config for API
export interface MCPServerApi {
  type: 'sse';
  url: string;
  headers?: KeyValuePair[];
  streaming?: boolean;
}

interface MCPContextType {
  mcpServers: MCPServer[];
  setMcpServers: (servers: MCPServer[]) => void;
  enabledMcpServers: MCPServer[];
  mcpServersForApi: MCPServerApi[];
  startServer: (serverId: string) => Promise<boolean>;
  stopServer: (serverId: string) => Promise<boolean>;
  updateServerStatus: (serverId: string, status: ServerStatus, errorMessage?: string) => void;
  toggleServerEnabled: (serverId: string, enabled: boolean) => Promise<boolean>;
  refreshServers: () => Promise<void>;
  getActiveServersForApi: () => MCPServerApi[];
  loading: boolean;
}

const MCPContext = createContext<MCPContextType | undefined>(undefined);

// Helper function to wait for server readiness
async function waitForServerReady(url: string, maxAttempts = 20, timeout = 5000) {
  for (let i = 0; i < maxAttempts; i++) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);
      
      const response = await fetch(url, { signal: controller.signal });
      clearTimeout(timeoutId);
      
      if (response.status === 200) {
        return true;
      }
    } catch (error) {
      console.log(`Server connection failed (attempt ${i + 1}): ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
    
    // Wait before next attempt with progressive backoff
    const waitTime = Math.min(1000 * (i + 1), 5000); // Start with 1s, increase each time, max 5s

    await new Promise(resolve => setTimeout(resolve, waitTime));
  }

  return false;
}

export function MCPProvider({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession();
  const [mcpServers, setMcpServers] = useState<MCPServer[]>([]);
  const [enabledMcpServers, setEnabledMcpServers] = useState<MCPServer[]>([]);
  const [loading, setLoading] = useState(true);

  // Load servers from database when session is available
  const refreshServers = async () => {
    if (!session?.user?.id) {
      setMcpServers([]);
      setEnabledMcpServers([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      
      // Get all servers
      const allServersResult = await getMCPServersAction();
      if (allServersResult.success) {
        setMcpServers(allServersResult.servers);
      }

      // Get enabled servers
      const enabledServersResult = await getEnabledMCPServersAction();
      if (enabledServersResult.success) {
        setEnabledMcpServers(enabledServersResult.servers);
      }
    } catch (error) {
      console.error('Failed to load MCP servers:', error);
    } finally {
      setLoading(false);
    }
  };

  // Load servers on mount and when session changes
  useEffect(() => {
    refreshServers();
  }, [session?.user?.id]);

  // Helper to get a server by ID
  const getServerById = (serverId: string): MCPServer | undefined => {
    return mcpServers.find(server => server.id === serverId);
  };
  
  // Update server status locally and in database
  const updateServerStatus = async (serverId: string, status: ServerStatus, errorMessage?: string) => {
    // Update local state immediately for responsiveness
    setMcpServers(currentServers => 
      currentServers.map(server => 
        server.id === serverId 
          ? { ...server, status, errorMessage: errorMessage || null } 
          : server
      )
    );

    // Update enabled servers if this server is enabled
    setEnabledMcpServers(currentServers => 
      currentServers.map(server => 
        server.id === serverId 
          ? { ...server, status, errorMessage: errorMessage || null } 
          : server
      )
    );

    // Update in database
    try {
      await updateMCPServerStatusAction(serverId, status, errorMessage);
    } catch (error) {
      console.error('Failed to update server status in database:', error);
    }
  };

  // Toggle server enabled status
  const toggleServerEnabled = async (serverId: string, enabled: boolean): Promise<boolean> => {
    try {
      const result = await toggleMCPServerEnabledAction(serverId, enabled);
      if (result.success) {
        // Refresh servers to get updated state
        await refreshServers();
        return true;
      }
      return false;
    } catch (error) {
      console.error('Failed to toggle server enabled status:', error);
      return false;
    }
  };

  // Refresh enabled servers specifically (for when servers are updated)
  const refreshEnabledServers = async () => {
    if (!session?.user?.id) return;
    
    try {
      const enabledServersResult = await getEnabledMCPServersAction();
      if (enabledServersResult.success) {
        setEnabledMcpServers(enabledServersResult.servers);
      }
    } catch (error) {
      console.error('Failed to refresh enabled MCP servers:', error);
    }
  };

  // Add effect to refresh enabled servers when mcpServers changes
  useEffect(() => {
    refreshEnabledServers();
  }, [mcpServers, session?.user?.id]);
  
  // Get active servers formatted for API usage
  const getActiveServersForApi = (): MCPServerApi[] => {
    return enabledMcpServers
      .filter(server => server.status === 'connected')
      .map(server => ({
        type: 'sse' as const,
        url: server.type === 'stdio' && server.sandboxUrl ? server.sandboxUrl : server.url,
        headers: (server.headers as Array<{ key: string; value: string }>) || [],
        streaming: server.streaming
      }));
  };
  
  // Start a server
  const startServer = async (serverId: string): Promise<boolean> => {
    const server = getServerById(serverId);
    if (!server) return false;
    
    // Mark server as connecting
    await updateServerStatus(serverId, 'connecting');
    
    try {
      // For SSE servers, just check if the endpoint is available
      if (server.type === 'sse') {
        const isReady = await waitForServerReady(server.url);
        await updateServerStatus(serverId, isReady ? 'connected' : 'error', 
          isReady ? undefined : 'Could not connect to server');
        
        return isReady;
      }
      
      // For stdio servers, start a sandbox
      if (server.type === 'stdio' && server.command && (server.args as string[])?.length) {
        // Check if we already have a valid sandbox URL
        if (server.sandboxUrl) {
          try {
            const isReady = await waitForServerReady(server.sandboxUrl);
            if (isReady) {
              await updateServerStatus(serverId, 'connected');
              return true;
            }
          } catch {
            // If sandbox check fails, we'll create a new one
          }
        }
        
        // Create a new sandbox
        const { url } = await startSandbox({
          id: serverId,
          command: server.command,
          args: server.args as string[],
          env: server.env as Array<{ key: string; value: string }>,
        });
        
        // Wait for the server to become ready
        const isReady = await waitForServerReady(url);
        
        if (isReady) {
          // Store the sandbox URL and update status
          console.log(`Server ${serverId} started successfully, sandbox URL: ${url}`);
          await updateServerStatus(serverId, 'connected');
          
          // Update the server with sandbox URL (this would need a separate action)
          // For now, we'll just update local state
          setMcpServers(currentServers => 
            currentServers.map(s => 
              s.id === serverId 
                ? { ...s, sandboxUrl: url, status: 'connected' } 
                : s
            )
          );
          
          return true;
        } else {
          // Failed to start
          await updateServerStatus(serverId, 'error', 'Server failed to start');
          
          // Clean up sandbox
          try {
            await stopSandbox(serverId);
          } catch (error) {
            console.error(`Failed to stop non-responsive sandbox ${serverId}:`, error);
          }
          
          return false;
        }
      }
      
      // If we get here, something is misconfigured
      await updateServerStatus(serverId, 'error', 'Invalid server configuration');
      return false;
    } catch (error) {
      // Handle any unexpected errors
      console.error(`Error starting server ${serverId}:`, error);
      await updateServerStatus(serverId, 'error', 
        `Error: ${error instanceof Error ? error.message : String(error)}`);
      return false;
    }
  };
  
  // Stop a server
  const stopServer = async (serverId: string): Promise<boolean> => {
    const server = getServerById(serverId);
    if (!server) return false;
    
    try {
      // For stdio servers with sandbox, stop the sandbox
      if (server.type === 'stdio' && server.sandboxUrl) {
        try {
          await stopSandbox(serverId);
          console.log(`Stopped sandbox for server ${serverId}`);
        } catch (error) {
          console.error(`Error stopping sandbox for server ${serverId}:`, error);
        }
      }
      
      // Update server status
      await updateServerStatus(serverId, 'disconnected');
      return true;
    } catch (error) {
      console.error(`Error stopping server ${serverId}:`, error);
      return false;
    }
  };
  
  // Calculate mcpServersForApi based on current state
  const mcpServersForApi = getActiveServersForApi();

  return (
    <MCPContext.Provider 
      value={{ 
        mcpServers, 
        setMcpServers, 
        enabledMcpServers,
        mcpServersForApi,
        startServer,
        stopServer,
        updateServerStatus,
        toggleServerEnabled,
        refreshServers,
        getActiveServersForApi,
        loading
      }}
    >
      {children}
    </MCPContext.Provider>
  );
}

export function useMCP() {
  const context = useContext(MCPContext);
  if (context === undefined) {
    throw new Error("useMCP must be used within an MCPProvider");
  }
  return context;
}
