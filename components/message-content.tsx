'use client';

import cx from 'classnames';
import { DocumentToolCall, DocumentToolResult } from './document';
import { Markdown } from './markdown';
import { MessageActions } from './message-actions';
import { PreviewAttachment } from './preview-attachment';
import { Weather } from './weather';
import { cn, sanitizeText } from '@/lib/utils';
import { MessageEditor } from './message-editor';
import { DocumentPreview } from './document-preview';
import { MessageReasoning } from './message-reasoning';
import type { MessageContentProps } from './message-types';
import ToolCallPreview from './tool-call-preview';

export const MessageContent = ({
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
  layout,
}: MessageContentProps) => {
  return (
    <div className={'flex flex-col gap-4 w-full'}>
      {message.experimental_attachments &&
        message.experimental_attachments.length > 0 && (
          <div
            data-testid={`message-attachments`}
            className="flex flex-row justify-end gap-2"
          >
            {message.experimental_attachments.map((attachment) => (
              <PreviewAttachment
                key={attachment.url}
                attachment={attachment}
              />
            ))}
          </div>
        )}

      {message.parts?.map((part, index) => {
        const { type } = part;
        const key = `message-${message.id}-part-${index}`;

        if (type === 'reasoning') {
          return (
            <MessageReasoning
              key={key}
              isLoading={isLoading}
              reasoning={part.reasoning}
            />
          );
        }

        if (type === 'text') {
          if (mode === 'view') {
            return (
              <div 
                key={key} 
                className={cn('flex flex-row items-start relative', {
                  // Bubble layout user message styling
                  'bg-sidebar  px-3 py-2 rounded-xl': 
                    message.role === 'user' && layout === 'bubble',
                  // Wide layout user message styling - no background since it's handled at parent level
                  'gap-2': 
                    message.role === 'user' && layout === 'wide',
                  // Assistant message styling (same for both layouts)
                  'gap-0': message.role === 'assistant',
                })}
              >
                <div
                  data-testid="message-content"
                  className="flex flex-col gap-4 w-full"
                >
                  <Markdown>{sanitizeText(part.text)}</Markdown>
                </div>
              </div>
            );
          }

          if (mode === 'edit') {
            return (
              <div key={key} 
                className="flex flex-row gap-2 items-start">
                <div className="size-6" />
                <MessageEditor
                  key={message.id}
                  message={message}
                  setMode={setMode}
                  setMessages={setMessages}
                  reload={reload}
                />
              </div>
            );
          }
        }

        if (type === 'tool-invocation') {
          const { toolInvocation } = part;
          const { toolName, toolCallId, state } = toolInvocation;

          if (state === 'call') {
            const { args } = toolInvocation;

            return (
              <div
                key={toolCallId}
                className={cx({
                  skeleton: ['getWeather'].includes(toolName),
                })}
              >
                {toolName === 'getWeather' ? (
                  <Weather />
                ) : toolName === 'createDocument' ? (
                  <DocumentPreview isReadonly={isReadonly} args={args} />
                ) : toolName === 'updateDocument' ? (
                  <DocumentToolCall
                    type="update"
                    args={args}
                    isReadonly={isReadonly}
                  />
                ) : toolName === 'requestSuggestions' ? (
                  <DocumentToolCall
                    type="request-suggestions"
                    args={args}
                    isReadonly={isReadonly}
                  />
                ) : <ToolCallPreview/>}
              </div>
            );
          }

          if (state === 'result') {
            
            const { result } = toolInvocation;

            return (
              <div key={toolCallId}>
                {toolName === 'getWeather' ? (
                  <Weather weatherAtLocation={result} />
                ) : toolName === 'createDocument' ? (
                  <DocumentPreview
                    isReadonly={isReadonly}
                    result={result}
                  />
                ) : toolName === 'updateDocument' ? (
                  <DocumentToolResult
                    type="update"
                    result={result}
                    isReadonly={isReadonly}
                  />
                ) : toolName === 'requestSuggestions' ? (
                  <DocumentToolResult
                    type="request-suggestions"
                    result={result}
                    isReadonly={isReadonly}
                  />
                ) : (
                <ToolCallPreview result={result} type='done' toolName={toolName}/>
                )}
              </div>
            );
          }
        }
      })}

      {!isReadonly && layout !== 'wide' && (
        <MessageActions
          key={`action-${message.id}`}
          chatId={chatId}
          message={message}
          vote={vote}
          isLoading={isLoading}
        />
      )}
    </div>
  );
};
