import type { UIMessage } from 'ai';
import type { Vote } from '@/lib/db/schema';
import type { UseChatHelpers } from '@ai-sdk/react';
import type { Dispatch, SetStateAction } from 'react';

export interface MessageComponentProps {
  chatId: string;
  message: UIMessage;
  vote: Vote | undefined;
  isLoading: boolean;
  setMessages: UseChatHelpers['setMessages'];
  reload: UseChatHelpers['reload'];
  isReadonly: boolean;
  requiresScrollPadding: boolean;
  mode: 'view' | 'edit';
  setMode: Dispatch<SetStateAction<'view' | 'edit'>>;
}

export interface MessageContentProps extends MessageComponentProps {
  layout: 'bubble' | 'wide';
}
