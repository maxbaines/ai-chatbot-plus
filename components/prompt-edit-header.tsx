'use client';

import { useRouter } from 'next/navigation';
import { ArrowLeft, PlusCircle, Settings, History } from 'lucide-react';
import { memo } from 'react';
import type { Session } from 'next-auth';

import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from './ui/tooltip';
import { UserMenu } from './user-menu';

function PurePromptEditHeader({
  session,
  onBack,
  onNewPrompt,
}: {
  session: Session;
  onBack?: () => void;
  onNewPrompt?: () => void;
}) {
  const router = useRouter();

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      router.push('/prompt');
    }
  };

  const handleNewPrompt = () => {
    if (onNewPrompt) {
      onNewPrompt();
    } else {
      // Mock for now - will implement new prompt functionality later
      console.log('New Prompt clicked');
    }
  };

  return (
    <header className="flex sticky top-0 bg-background py-1.5 px-2 md:px-2 gap-2 items-center">

      {/* New Prompt button */}
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="outline"
            className="h-9 min-h-9 max-h-9 px-2"
            onClick={handleNewPrompt}
          >
            <PlusCircle className="size-3" />
            <span className="sr-only">New Prompt</span>
          </Button>
        </TooltipTrigger>
        <TooltipContent>New Prompt</TooltipContent>
      </Tooltip>

       {/* Back button */}
       <Button variant="outline" className="h-9 min-h-9 max-h-9 px-2 gap-2" onClick={handleBack}>
        <ArrowLeft className="size-4" />
        Back to Prompts
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

export const PromptEditHeader = memo(PurePromptEditHeader);
