'use client';

import { useRouter } from 'next/navigation';
import { ChevronDown, PlusCircle, Search, Settings, History, MessageCircle } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { memo } from 'react';
import { Tooltip, TooltipContent, TooltipTrigger } from './ui/tooltip';
import { Input } from '@/components/ui/input';
import { UserMenu } from './user-menu';
import type { Session } from 'next-auth';

function PureMCPHeader({
  session,
  activeTab,
  onTabChange,
  searchTerm,
  onSearchChange,
  serverCounts,
}: {
  session: Session;
  activeTab: string;
  onTabChange: (value: string) => void;
  searchTerm: string;
  onSearchChange: (value: string) => void;
  serverCounts: {
    connected: number;
    disconnected: number;
    sse: number;
    stdio: number;
    all: number;
  };
}) {
  const router = useRouter();

  return (
    <header className="flex sticky top-0 bg-background py-1.5 px-2 md:px-2 gap-2 items-center">
      {/* Add Server button on the left */}
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="outline"
            className="h-9 min-h-9 max-h-9 px-2"
            onClick={() => {
              router.push("/mcp-client/new")
            }}
          >
            <PlusCircle className="size-3" />
            <span className="sr-only">Add Server</span>
          </Button>
        </TooltipTrigger>
        <TooltipContent>Add Server</TooltipContent>
      </Tooltip>

      {/* Search in the middle-left */}
      <div className="relative w-64">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground size-4" />
        <Input
          placeholder="Search servers..."
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-10 h-9"
        />
      </div>

      {/* Spacer to push everything to the right */}
      <div className="flex-1" />

      {/* Right side controls */}
      <div className="flex items-center gap-2 h-9">
        {/* Filter dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              className="h-9 min-h-9 max-h-9 px-2"
            >
              {activeTab === 'connected' && `Connected (${serverCounts.connected})`}
              {activeTab === 'disconnected' && `Disconnected (${serverCounts.disconnected})`}
              {activeTab === 'sse' && `SSE (${serverCounts.sse})`}
              {activeTab === 'stdio' && `Stdio (${serverCounts.stdio})`}
              {activeTab === 'all' && `All (${serverCounts.all})`}
              <ChevronDown className="size-3 ml-1" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            <DropdownMenuItem onClick={() => onTabChange('all')}>
              All ({serverCounts.all})
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onTabChange('connected')}>
              Connected ({serverCounts.connected})
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onTabChange('disconnected')}>
              Disconnected ({serverCounts.disconnected})
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onTabChange('sse')}>
              SSE ({serverCounts.sse})
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onTabChange('stdio')}>
              Stdio ({serverCounts.stdio})
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        
        {/* User menu */}
        <UserMenu
          session={session}
          showThemeSelector={true}
          showCommandPalette={true}
          menuItems={[
            {
              type: 'link',
              icon: MessageCircle,
              label: 'New Chat',
              href: '/'
            },
          ]}
        />
      </div>
    </header>
  );
}

export const MCPHeader = memo(PureMCPHeader, (prevProps, nextProps) => {
  return (
    prevProps.activeTab === nextProps.activeTab &&
    prevProps.searchTerm === nextProps.searchTerm &&
    prevProps.serverCounts.connected === nextProps.serverCounts.connected &&
    prevProps.serverCounts.disconnected === nextProps.serverCounts.disconnected &&
    prevProps.serverCounts.sse === nextProps.serverCounts.sse &&
    prevProps.serverCounts.stdio === nextProps.serverCounts.stdio &&
    prevProps.serverCounts.all === nextProps.serverCounts.all
  );
});
