'use client';

import type { UIMessage } from 'ai';
import { AnimatePresence, motion } from 'framer-motion';
import { memo, useState } from 'react';
import type { Vote } from '@/lib/db/schema';
import equal from 'fast-deep-equal';
import { cn } from '@/lib/utils';
import type { UseChatHelpers } from '@ai-sdk/react';
import { useChatLayout } from '@/hooks/use-chat-layout';
import { BubbleMessage } from './bubble-message';
import { WideMessage } from './wide-message';

const PurePreviewMessage = ({
  chatId,
  message,
  vote,
  isLoading,
  setMessages,
  reload,
  isReadonly,
  requiresScrollPadding,
}: {
  chatId: string;
  message: UIMessage;
  vote: Vote | undefined;
  isLoading: boolean;
  setMessages: UseChatHelpers['setMessages'];
  reload: UseChatHelpers['reload'];
  isReadonly: boolean;
  requiresScrollPadding: boolean;
}) => {
  const [mode, setMode] = useState<'view' | 'edit'>('view');
  const { layout } = useChatLayout();

  return (
    <AnimatePresence>
      <motion.div
        data-testid={`message-${message.role}`}
        className={cn(
          "w-full mx-auto group/message relative",
          {
            "max-w-3xl px-4": layout === 'bubble',
            "max-w-none": layout === 'wide',
          }
        )}
        initial={{ y: 5, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        data-role={message.role}
      >
        {layout === 'bubble' ? (
          <BubbleMessage
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
          />
        ) : (
          <WideMessage
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
          />
        )}
      </motion.div>
    </AnimatePresence>
  );
};

export const PreviewMessage = memo(
  PurePreviewMessage,
  (prevProps, nextProps) => {
    if (prevProps.isLoading !== nextProps.isLoading) return false;
    if (prevProps.message.id !== nextProps.message.id) return false;
    if (prevProps.requiresScrollPadding !== nextProps.requiresScrollPadding)
      return false;
    if (!equal(prevProps.message.parts, nextProps.message.parts)) return false;
    if (!equal(prevProps.vote, nextProps.vote)) return false;

    return true;
  },
);

// Re-export ThinkingMessage for backward compatibility
export { ThinkingMessage } from './message-thinking';
