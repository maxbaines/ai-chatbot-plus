'use client';

import { cn } from '@/lib/utils';
import { SparklesIcon, PencilEditIcon } from './icons';
import { MessageContent } from './message-content';
import { MessageActions } from './message-actions';
import { UserActions } from './user-actions';
import { Tooltip, TooltipContent, TooltipTrigger } from './ui/tooltip';
import type { MessageComponentProps } from './message-types';
import { UserIcon } from 'lucide-react';

export const WideMessage = ({
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
    <div className={cn('flex w-full relative py-6', {
      'bg-sidebar/50 dark:bg-sidebar/30': message.role === 'assistant',
    })}>
      <div className="flex w-full justify-center px-4 relative">
        {/* Center the content container */}
        <div className="w-full max-w-5xl">
          {message.role === 'assistant' && (
            <div className="mb-3 flex items-center gap-2">
              <div className="size-6 flex items-center rounded-full justify-center ring-1 shrink-0 ring-border bg-background">
                <div className="translate-y-px">
                  <SparklesIcon size={14} />
                </div>
              </div>
              <span className="font-bold">Assistant</span>
              {!isReadonly && (
                <MessageActions
                  chatId={chatId}
                  message={message}
                  vote={vote}
                  isLoading={isLoading}
                />
              )}
            </div>
          )}

          {message.role === 'user' && !isReadonly && (
            <div className="mb-3 flex items-center gap-2">
              <div className="size-6 flex items-center rounded-full justify-center ring-1 shrink-0 ring-border bg-background">
                <div className="translate-y-px">
                  <UserIcon size={14}/>
                </div>
              </div>
              <span className="font-bold">User</span>
              <UserActions
                message={message}
                setMode={setMode}
              />
            </div>
          )}

          {message.role === 'user' && isReadonly && (
            <div className="mb-3 flex justify-start items-center gap-2">
              <div className="size-6 flex items-center rounded-full justify-center ring-1 shrink-0 ring-border bg-background">
                <div className="translate-y-px">
                <UserIcon size={14}/>
                </div>
              </div>
              <span className="font-bold">User</span>
            </div>
          )}

          <div className="prose dark:prose-invert prose-zinc">
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
              layout="wide"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
