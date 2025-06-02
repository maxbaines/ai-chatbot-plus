'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { ChevronDownIcon } from './icons';
import { useMCP } from '@/lib/ai/mcp/mcp-context';
import { cn } from '@/lib/utils';
import { CheckCircle, Clock, AlertCircle, Square, Wifi, Terminal } from 'lucide-react';

export function MCPSelector({
  className,
}: {
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const { mcpServers, enabledMcpServers, toggleServerEnabled, loading } = useMCP();

  const getStatusIcon = (status?: string) => {
    switch (status) {
      case 'connected':
        return <CheckCircle className="size-3 text-green-500" />;
      case 'connecting':
        return <Clock className="size-3 text-yellow-500 animate-pulse" />;
      case 'error':
        return <AlertCircle className="size-3 text-red-500" />;
      default:
        return <Square className="size-3 text-gray-400" />;
    }
  };

  const getStatusBadgeVariant = (status?: string, enabled?: boolean) => {
    if (enabled === false) return "outline";
    switch (status) {
      case 'connected':
        return "default";
      case 'connecting':
        return "secondary";
      case 'error':
        return "destructive";
      default:
        return "outline";
    }
  };

  const getDisplayStatus = (status?: string, enabled?: boolean) => {
    if (enabled === false) return 'disabled';
    return status || 'disconnected';
  };

  const getTypeIcon = (type: 'sse' | 'stdio') => {
    switch (type) {
      case 'sse':
        return <Wifi className="size-3" />;
      case 'stdio':
        return <Terminal className="size-3" />;
      default:
        return null;
    }
  };

  const handleToggleServer = async (serverId: string, enabled: boolean) => {
    await toggleServerEnabled(serverId, enabled);
  };

  const enabledCount = enabledMcpServers.length;
  const hasErrors = mcpServers.some(server => server.status === 'error' && server.enabled);

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger
        asChild
        className={cn(
          'w-fit data-[state=open]:bg-accent data-[state=open]:text-accent-foreground',
          className,
        )}
      >
        <Button
          variant="outline"
          className="md:px-2 md:h-[34px] relative"
          disabled={loading}
        >
          <span className="flex items-center gap-1">
            MCP ({enabledCount})
            {hasErrors && <AlertCircle className="size-3 text-red-500" />}
          </span>
          <ChevronDownIcon />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-[320px] p-0">
       
        <div className="max-h-[300px] overflow-y-auto">
          {mcpServers.length === 0 ? (
            <div className="p-4 text-center text-sm text-muted-foreground">
              No MCP servers configured
            </div>
          ) : (
            mcpServers.map((server) => (
              <DropdownMenuItem
                key={server.id}
                onSelect={(e) => e.preventDefault()}
                className="p-0"
              >
                <div className="flex items-center justify-between w-full p-3 hover:bg-accent/50">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-sm truncate">{server.name}</span>
                      {getStatusIcon(server.status)}
                    </div>
                
                    {server.description && (
                      <div className="text-xs text-muted-foreground mt-1 line-clamp-1">
                        {server.description}
                      </div>
                    )}
                  </div>
                  <div className="ml-3">
                    <Switch
                      checked={server.enabled ?? false}
                      onCheckedChange={(checked) => handleToggleServer(server.id, checked)}
                    />
                  </div>
                </div>
              </DropdownMenuItem>
            ))
          )}
        </div>

        {mcpServers.length > 0 && (
          <div className="p-2 border-t">
            <Button
              variant="ghost"
              size="sm"
              className="w-full text-xs text-muted-foreground h-auto py-1"
              onClick={() => {
                setOpen(false);
                router.push('/mcp-client');
              }}
            >
              Manage servers in MCP settings
            </Button>
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
