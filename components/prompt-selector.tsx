'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import {
  CheckCircleFillIcon,
  ChevronDownIcon,
} from './icons';
import type { Prompt } from '@/lib/db/schema';
import { saveSelectedPromptAsCookie, updateChatPromptAction } from '@/app/(chat)/actions';

export function PromptSelector({
  className,
  initialPrompts,
  selectedPromptId,
  chatId,
  isExistingChat = false,
}: {
  initialPrompts: Array<Prompt>;
  selectedPromptId?: string;
  chatId?: string;
  isExistingChat?: boolean;
} & React.ComponentProps<typeof Button>) {
  const [open, setOpen] = useState(false);
  const [currentPromptId, setCurrentPromptId] = useState(selectedPromptId);
  
  const selectedPrompt = initialPrompts.find(p => p.id === currentPromptId);

  const handlePromptSelect = async (prompt: Prompt) => {
    // Update UI immediately
    setCurrentPromptId(prompt.id);
    setOpen(false);
    
    // Save to cookie
    await saveSelectedPromptAsCookie(prompt.id);
    
    // Update database for existing chats
    if (isExistingChat && chatId) {
      await updateChatPromptAction({ chatId, promptId: prompt.id });
    }
  };

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
          data-testid="prompt-selector"
          variant="outline"
          className="hidden md:flex h-9 min-h-9 max-h-9 px-2"
        >
          {selectedPrompt ? selectedPrompt.name : 'Default Chat Prompt'}
          <ChevronDownIcon />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="start" className="min-w-[300px]">
        {initialPrompts.map((prompt) => (
          <DropdownMenuItem
            data-testid={`prompt-selector-item-${prompt.id}`}
            key={prompt.id}
            onSelect={() => handlePromptSelect(prompt)}
            className="gap-4 group/item flex flex-row justify-between items-center"
            data-active={prompt.id === currentPromptId}
          >
            <div className="flex flex-col gap-1 items-start">
              {prompt.name}
              {prompt.description && (
                <div className="text-xs text-muted-foreground">
                  {prompt.description}
                </div>
              )}
            </div>
            <div className="text-foreground dark:text-foreground opacity-0 group-data-[active=true]/item:opacity-100">
              <CheckCircleFillIcon />
            </div>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
