"use client";

import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from "react";
import { useSession } from "next-auth/react";
import { 
  getMCPServersAction, 
  toggleMCPServerEnabledAction,
  updateMCPServerStatusAction
} from "@/app/(mcp-client)/actions";
import type { MCPServer } from "@/lib/db/schema";

// Mock sandbox functions - optimized with minimal delays
const startSandbox = async ({ id, command, args, env }: {
  id: string;
  command: string;
  args: string[];
  env?: Array<{ key: string; value: string }>;
}) => {
  // Mock implementation - in real scenario this would start a sandbox
  console.log(`Mock: Starting sandbox for ${id} with command: ${command}`, { args, env });
  
  // Return a mock URL immediately (removed artificial delay)
  return {
    url: `http://localhost:${3000 + Math.floor(Math.random() * 1000)}/mcp`
  };
};

const stopSandbox = async (id: string) => {
  // Mock implementation - in real scenario this would stop a sandbox
  console.log(`Mock: Stopping sandbox for ${id}`);
  
  // Return immediately (removed artificial delay)
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

// Helper function to wait for server readiness - optimized with shorter timeouts
async function waitForServerReady(url: string, maxAttempts = 10, timeout = 2000) {
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
    
    // Wait before next attempt with shorter backoff
    const waitTime = Math.min(500 * (i + 1), 2000); // Start with 500ms, max 2s
    await new Promise(resolve => setTimeout(resolve, waitTime));
  }

  return false;
}

export function MCPProvider({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession();
  const [mcpServers, setMcpServers] = useState<MCPServer[]>([]);
  const [loading, setLoading] = useState(true);

  // Derive enabled servers from all servers using useMemo for performance
  const enabledMcpServers = useMemo(() => {
    return mcpServers.filter(server => server.enabled);
  }, [mcpServers]);

  // Derive API servers from enabled servers using useMemo
  const mcpServersForApi = useMemo((): MCPServerApi[] => {
    return enabledMcpServers
      .filter(server => server.status === 'connected')
      .map(server => ({
        type: 'sse' as const,
        url: server.type === 'stdio' && server.sandboxUrl ? server.sandboxUrl : server.url,
        headers: (server.headers as Array<{ key: string; value: string }>) || [],
        streaming: server.streaming
      }));
  }, [enabledMcpServers]);

  // Optimized refresh function - single database call
  const refreshServers = useCallback(async () => {
    if (!session?.user?.id) {
      setMcpServers([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      
      // Single database call to get all servers
      const allServersResult = await getMCPServersAction();
      if (allServersResult.success) {
        setMcpServers(allServersResult.servers);
      }
    } catch (error) {
      console.error('Failed to load MCP servers:', error);
    } finally {
      setLoading(false);
    }
  }, [session?.user?.id]);

  // Load servers on mount and when session changes
  useEffect(() => {
    refreshServers();
  }, [refreshServers]);

  // Helper to get a server by ID - memoized for performance
  const getServerById = useCallback((serverId: string): MCPServer | undefined => {
    return mcpServers.find(server => server.id === serverId);
  }, [mcpServers]);
  
  // Optimized server status update with batched state changes
  const updateServerStatus = useCallback(async (serverId: string, status: ServerStatus, errorMessage?: string) => {
    // Update local state immediately for responsiveness
    setMcpServers(currentServers => 
      currentServers.map(server => 
        server.id === serverId 
          ? { ...server, status, errorMessage: errorMessage || null } 
          : server
      )
    );

    // Update in database (async, non-blocking)
    try {
      await updateMCPServerStatusAction(serverId, status, errorMessage);
    } catch (error) {
      console.error('Failed to update server status in database:', error);
    }
  }, []);

  // Optimized toggle function with optimistic updates
  const toggleServerEnabled = useCallback(async (serverId: string, enabled: boolean): Promise<boolean> => {
    // Optimistic update - update UI immediately
    setMcpServers(currentServers => 
      currentServers.map(server => 
        server.id === serverId 
          ? { ...server, enabled } 
          : server
      )
    );

    try {
      const result = await toggleMCPServerEnabledAction(serverId, enabled);
      if (result.success) {
        return true;
      } else {
        // Revert optimistic update on failure
        setMcpServers(currentServers => 
          currentServers.map(server => 
            server.id === serverId 
              ? { ...server, enabled: !enabled } 
              : server
          )
        );
        return false;
      }
    } catch (error) {
      console.error('Failed to toggle server enabled status:', error);
      // Revert optimistic update on error
      setMcpServers(currentServers => 
        currentServers.map(server => 
          server.id === serverId 
            ? { ...server, enabled: !enabled } 
            : server
        )
      );
      return false;
    }
  }, []);
  
  // Memoized function to get active servers for API
  const getActiveServersForApi = useCallback((): MCPServerApi[] => {
    return mcpServersForApi;
  }, [mcpServersForApi]);
  
  // Optimized start server function
  const startServer = useCallback(async (serverId: string): Promise<boolean> => {
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
          
          // Update the server with sandbox URL
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
  }, [getServerById, updateServerStatus]);
  
  // Optimized stop server function
  const stopServer = useCallback(async (serverId: string): Promise<boolean> => {
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
  }, [getServerById, updateServerStatus]);

  // Memoize context value to prevent unnecessary re-renders
  const contextValue = useMemo(() => ({
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
  }), [
    mcpServers,
    enabledMcpServers,
    mcpServersForApi,
    startServer,
    stopServer,
    updateServerStatus,
    toggleServerEnabled,
    refreshServers,
    getActiveServersForApi,
    loading
  ]);

  return (
    <MCPContext.Provider value={contextValue}>
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
