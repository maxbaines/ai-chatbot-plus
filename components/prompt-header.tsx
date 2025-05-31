'use client';

import { useRouter } from 'next/navigation';
import { useWindowSize } from 'usehooks-ts';
import { ChevronDown, PlusCircle, Search, Settings, History } from 'lucide-react';

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

function PurePromptHeader({
  session,
  activeTab,
  onTabChange,
  searchTerm,
  onSearchChange,
  promptCounts,
}: {
  session: Session;
  activeTab: string;
  onTabChange: (value: string) => void;
  searchTerm: string;
  onSearchChange: (value: string) => void;
  promptCounts: {
    custom: number;
    defaults: number;
    all: number;
  };
}) {
  const router = useRouter();

  return (
    <header className="flex sticky top-0 bg-background py-1.5 px-2 md:px-2 gap-2 items-center">
      {/* New Prompt button on the left */}
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="outline"
            className="h-9 min-h-9 max-h-9 px-2"
            onClick={() => {
              router.push("/prompt/new")
            }}
          >
            <PlusCircle className="size-3" />
            <span className="sr-only">New Prompt</span>
          </Button>
        </TooltipTrigger>
        <TooltipContent>New Prompt</TooltipContent>
      </Tooltip>

      {/* Search in the middle-left */}
      <div className="relative w-64">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground size-4" />
        <Input
          placeholder="Search prompts..."
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
              {activeTab === 'custom' && `Custom (${promptCounts.custom})`}
              {activeTab === 'defaults' && `Defaults (${promptCounts.defaults})`}
              {activeTab === 'all' && `All (${promptCounts.all})`}
              <ChevronDown className="size-3 ml-1" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            <DropdownMenuItem onClick={() => onTabChange('custom')}>
              Custom ({promptCounts.custom})
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onTabChange('defaults')}>
              Defaults ({promptCounts.defaults})
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onTabChange('all')}>
              All ({promptCounts.all})
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
      </div>
    </header>
  );
}

export const PromptHeader = memo(PurePromptHeader, (prevProps, nextProps) => {
  return (
    prevProps.activeTab === nextProps.activeTab &&
    prevProps.searchTerm === nextProps.searchTerm &&
    prevProps.promptCounts.custom === nextProps.promptCounts.custom &&
    prevProps.promptCounts.defaults === nextProps.promptCounts.defaults &&
    prevProps.promptCounts.all === nextProps.promptCounts.all
  );
});
