'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useWindowSize } from 'usehooks-ts';

import { ModelSelector } from '@/components/model-selector';
import { SidebarToggle } from '@/components/sidebar-toggle';
import { Button } from '@/components/ui/button';
import { PlusIcon } from './icons';
import { useSidebar } from './ui/sidebar';
import { memo } from 'react';
import { type VisibilityType, VisibilitySelector } from './visibility-selector';
import { PromptSelector } from './prompt-selector';
import { MCPSelector } from './mcp-selector';
import type { Session } from 'next-auth';
import type { Prompt } from '@/lib/db/schema';

function PureChatHeader({
  chatId,
  selectedModelId,
  selectedVisibilityType,
  isReadonly,
  session,
  initialPrompts,
  selectedPromptId,
  isExistingChat,
}: {
  chatId: string;
  selectedModelId: string;
  selectedVisibilityType: VisibilityType;
  isReadonly: boolean;
  session: Session;
  initialPrompts: Array<Prompt>;
  selectedPromptId?: string;
  isExistingChat: boolean;
}) {
  const router = useRouter();
  const { open } = useSidebar();

  const { width: windowWidth } = useWindowSize();

  return (
    <header className="flex sticky top-0 bg-background py-1.5 items-center px-2 md:px-2 gap-2 z-50">
      <SidebarToggle />

      {(!open || windowWidth < 768) && (
        <Button
          variant="outline"
          className="order-1 md:px-2 px-2 md:h-fit ml-auto md:ml-0"
          onClick={() => {
            router.push('/');
            router.refresh();
          }}
              
        >
          <PlusIcon />
          <span className="md:sr-only">New Chat</span>
        </Button>
      )}

      {!isReadonly && (
        <ModelSelector
          session={session}
          selectedModelId={selectedModelId}
          chatId={chatId}
          isExistingChat={isExistingChat}
          className="order-2"
        />
      )}

      {!isReadonly && (
        <PromptSelector
          key={chatId}
          initialPrompts={initialPrompts}
          selectedPromptId={selectedPromptId}
          chatId={chatId}
          isExistingChat={isExistingChat}
          className="order-1 md:order-2"
        />
      )}

      {!isReadonly && (
        <MCPSelector
          className="order-1 md:order-3"
        />
      )}

      {!isReadonly && (
        <VisibilitySelector
          chatId={chatId}
          selectedVisibilityType={selectedVisibilityType}
          className="order-1 md:order-4"
        />
      )}

      
    
    </header>
  );
}

export const ChatHeader = memo(PureChatHeader, (prevProps, nextProps) => {
  return (
    prevProps.chatId === nextProps.chatId &&
    prevProps.selectedModelId === nextProps.selectedModelId && 
    prevProps.selectedPromptId === nextProps.selectedPromptId &&
    prevProps.selectedVisibilityType === nextProps.selectedVisibilityType &&
    prevProps.isReadonly === nextProps.isReadonly &&
    prevProps.isExistingChat === nextProps.isExistingChat
  );
});
