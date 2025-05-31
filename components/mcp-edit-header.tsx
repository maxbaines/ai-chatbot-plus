'use client';

import { useRouter } from 'next/navigation';
import { ArrowLeft, PlusCircle, Settings, History } from 'lucide-react';
import { memo } from 'react';
import type { Session } from 'next-auth';

import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from './ui/tooltip';
import { UserMenu } from './user-menu';

function PureMCPEditHeader({
  session,
  onBack,
  onNewServer,
}: {
  session: Session;
  onBack?: () => void;
  onNewServer?: () => void;
}) {
  const router = useRouter();

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      router.push('/mcp-client');
    }
  };

  const handleNewServer = () => {
    if (onNewServer) {
      onNewServer();
    } else {
      router.push('/mcp-client/new');
    }
  };

  return (
    <header className="flex sticky top-0 bg-background py-1.5 px-2 md:px-2 gap-2 items-center">

      {/* Add Server button */}
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="outline"
            className="h-9 min-h-9 max-h-9 px-2"
            onClick={handleNewServer}
          >
            <PlusCircle className="size-3" />
            <span className="sr-only">Add Server</span>
          </Button>
        </TooltipTrigger>
        <TooltipContent>Add Server</TooltipContent>
      </Tooltip>

       {/* Back button */}
       <Button variant="outline" className="h-9 min-h-9 max-h-9 px-2 gap-2" onClick={handleBack}>
        <ArrowLeft className="size-4" />
        Back to Servers
      </Button>

      {/* Spacer to push user menu to the right */}
      <div className="flex-1" />

      {/* User menu */}
      <UserMenu
        session={session}
        showThemeSelector={true}
        showCommandPalette={true}
        menuItems={[
          {
            type: 'link',
            icon: Settings,
            label: 'Settings',
            href: '/settings'
          },
          {
            type: 'link',
            icon: History,
            label: 'History',
            href: '/reporting'
          }
        ]}
      />
    </header>
  );
}

export const MCPEditHeader = memo(PureMCPEditHeader);
