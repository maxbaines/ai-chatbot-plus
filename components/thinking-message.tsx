'use client';

import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { SparklesIcon } from './icons';
import { useChatLayout } from '@/hooks/use-chat-layout';

export const ThinkingMessage = () => {
  const role = 'assistant';
  const { layout } = useChatLayout();

  return (
    <motion.div
      data-testid="message-assistant-loading"
      className={cn(
        "w-full mx-auto group/message",
        {
          "max-w-3xl px-4": layout === 'bubble',
          "max-w-none": layout === 'wide',
        }
      )}
      initial={{ y: 5, opacity: 0 }}
      animate={{ y: 0, opacity: 1, transition: { delay: 1 } }}
      data-role={role}
    >
      <div className={cn('flex w-full', {
        'gap-4': layout === 'bubble',
        'justify-center px-4': layout === 'wide',
      })}>
        {layout === 'wide' ? (
          <div className="w-full max-w-5xl relative">
            <div className="absolute left-0 top-0 size-6 flex items-center rounded-full justify-center ring-1 shrink-0 ring-border bg-background">
              <div className="translate-y-px">
                <SparklesIcon size={14} />
              </div>
            </div>
            <div className="ml-12">
              <div className="flex flex-col gap-4 text-muted-foreground">
                Hmm...
              </div>
            </div>
          </div>
        ) : (
          <>
            <div className="size-8 flex items-center rounded-full justify-center ring-1 shrink-0 ring-border bg-background">
              <div className="translate-y-px">
                <SparklesIcon size={14} />
              </div>
            </div>
            <div className="flex flex-col gap-2 w-full">
              <div className="flex flex-col gap-4 text-muted-foreground">
                Hmm...
              </div>
            </div>
          </>
        )}
      </div>
    </motion.div>
  );
};
