'use client';

import { cn } from '@/lib/utils';
import { SparklesIcon, PencilEditIcon } from './icons';
import { MessageContent } from './message-content';
import { Tooltip, TooltipContent, TooltipTrigger } from './ui/tooltip';
import type { MessageComponentProps } from './message-types';
import { UserIcon } from 'lucide-react';

export const BubbleMessage = ({
  chatId,
  message,
  vote,
  isLoading,
  setMessages,
  reload,
  isReadonly,
  requiresScrollPadding,
  mode,
  setMode,
}: MessageComponentProps) => {
  return (
    <div className={cn(
      'flex gap-4 w-full',
      {
        'w-full': mode === 'edit',
        'ml-auto max-w-2xl w-fit pb-6 pt-2': message.role === 'user' && mode !== 'edit',
      }
    )}>
      {message.role === 'assistant' && (
        <div className="size-6 flex items-center rounded-full justify-center ring-1 shrink-0 ring-border bg-background">
          <div className="translate-y-px">
            <SparklesIcon size={14} />
          </div>
        </div>
      )}

      {message.role === 'user' && !isReadonly && (
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              className="size-6 mt-2 flex items-center rounded-full justify-center ring-1 shrink-0 ring-border bg-background hover:bg-muted transition-colors group"
              onClick={() => setMode('edit')}
            >
              <div className="translate-y-px">
                <div className="group-hover:hidden">
                <UserIcon size={14}/>
                </div>
                <div className="hidden group-hover:block">
                  <PencilEditIcon />
                </div>
              </div>
            </button>
          </TooltipTrigger>
          <TooltipContent>Edit message</TooltipContent>
        </Tooltip>
      )}

      {message.role === 'user' && isReadonly && (
        <div className="size-6 flex items-center rounded-full justify-center ring-1 shrink-0 ring-border bg-background">
          <div className="translate-y-px">
          <UserIcon size={14}/>
          </div>
        </div>
      )}

      <MessageContent
        chatId={chatId}
        message={message}
        vote={vote}
        isLoading={isLoading}
        setMessages={setMessages}
        reload={reload}
        isReadonly={isReadonly}
        requiresScrollPadding={requiresScrollPadding}
        mode={mode}
        setMode={setMode}
        layout="bubble"
      />
    </div>
  );
};
