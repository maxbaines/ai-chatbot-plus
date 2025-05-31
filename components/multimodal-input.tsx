'use client';

import type { Attachment, UIMessage } from 'ai';
import cx from 'classnames';
import type React from 'react';
import {
  useRef,
  useEffect,
  useState,
  useCallback,
  type Dispatch,
  type SetStateAction,
  type ChangeEvent,
  memo,
} from 'react';
import { toast } from 'sonner';
import { useLocalStorage, useWindowSize } from 'usehooks-ts';

import { ArrowUpIcon, PaperclipIcon, StopIcon } from './icons';
import { PreviewAttachment } from './preview-attachment';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import equal from 'fast-deep-equal';
import type { UseChatHelpers } from '@ai-sdk/react';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowDown } from 'lucide-react';
import { useScrollToBottom } from '@/hooks/use-scroll-to-bottom';
import type { VisibilityType } from './visibility-selector';

function PureMultimodalInput({
  chatId,
  input,
  setInput,
  status,
  stop,
  attachments,
  setAttachments,
  messages,
  setMessages,
  append,
  handleSubmit,
  className,
  selectedVisibilityType,
}: {
  chatId: string;
  input: UseChatHelpers['input'];
  setInput: UseChatHelpers['setInput'];
  status: UseChatHelpers['status'];
  stop: () => void;
  attachments: Array<Attachment>;
  setAttachments: Dispatch<SetStateAction<Array<Attachment>>>;
  messages: Array<UIMessage>;
  setMessages: UseChatHelpers['setMessages'];
  append: UseChatHelpers['append'];
  handleSubmit: UseChatHelpers['handleSubmit'];
  className?: string;
  selectedVisibilityType: VisibilityType;
}) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { width } = useWindowSize();

  // History management
  const [inputHistory, setInputHistory] = useLocalStorage<Array<{text: string, timestamp: number}>>('input-history', []);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [ghostSuggestion, setGhostSuggestion] = useState('');
  const [draftInput, setDraftInput] = useState('');

  const HISTORY_LIMIT = 50;

  useEffect(() => {
    if (textareaRef.current) {
      adjustHeight();
    }
  }, []);

  const adjustHeight = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight + 2}px`;
    }
  };

  const resetHeight = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = '98px';
    }
  };

  const [localStorageInput, setLocalStorageInput] = useLocalStorage(
    'input',
    '',
  );

  // Add input to history when form is submitted
  const addToHistory = useCallback((inputText: string) => {
    const trimmedInput = inputText.trim();
    if (!trimmedInput) return;

    setInputHistory(prevHistory => {
      // Check if the last entry is the same to avoid duplicates
      if (prevHistory.length > 0 && prevHistory[prevHistory.length - 1].text === trimmedInput) {
        return prevHistory;
      }

      const newEntry = { text: trimmedInput, timestamp: Date.now() };
      const updatedHistory = [...prevHistory, newEntry];

      // Limit history size
      if (updatedHistory.length > HISTORY_LIMIT) {
        return updatedHistory.slice(-HISTORY_LIMIT);
      }

      return updatedHistory;
    });
  }, [setInputHistory, HISTORY_LIMIT]);

  // Navigate through history
  const navigateHistory = useCallback((direction: 'up' | 'down') => {
    if (inputHistory.length === 0) return;

    if (direction === 'up') {
      if (historyIndex === -1) {
        // Save current input as draft
        setDraftInput(input);
        setHistoryIndex(inputHistory.length - 1);
        setInput(inputHistory[inputHistory.length - 1].text);
      } else if (historyIndex > 0) {
        setHistoryIndex(historyIndex - 1);
        setInput(inputHistory[historyIndex - 1].text);
      }
    } else if (direction === 'down') {
      if (historyIndex === -1) return;
      
      if (historyIndex < inputHistory.length - 1) {
        setHistoryIndex(historyIndex + 1);
        setInput(inputHistory[historyIndex + 1].text);
      } else {
        // Return to draft
        setHistoryIndex(-1);
        setInput(draftInput);
        setDraftInput('');
      }
    }
  }, [input, inputHistory, historyIndex, draftInput, setInput]);

  // Update ghost suggestion based on current input
  useEffect(() => {
    if (historyIndex !== -1) {
      // Don't show suggestions when navigating history
      setGhostSuggestion('');
      return;
    }

    if (!input.trim()) {
      setGhostSuggestion('');
      return;
    }

    // Find the most recent matching history entry
    const matchingEntry = inputHistory
      .slice()
      .reverse()
      .find(entry => 
        entry.text.toLowerCase().startsWith(input.toLowerCase()) && 
        entry.text.length > input.length
      );

    if (matchingEntry) {
      setGhostSuggestion(matchingEntry.text.slice(input.length));
    } else {
      setGhostSuggestion('');
    }
  }, [input, inputHistory, historyIndex]);

  // Accept ghost suggestion
  const acceptSuggestion = useCallback(() => {
    if (ghostSuggestion) {
      setInput(input + ghostSuggestion);
      setGhostSuggestion('');
    }
  }, [input, ghostSuggestion, setInput]);

  useEffect(() => {
    if (textareaRef.current) {
      const domValue = textareaRef.current.value;
      // Prefer DOM value over localStorage to handle hydration
      const finalValue = domValue || localStorageInput || '';
      setInput(finalValue);
      adjustHeight();
    }
    // Only run once after hydration
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    setLocalStorageInput(input);
  }, [input, setLocalStorageInput]);

  const handleInput = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(event.target.value);
    adjustHeight();
    
    // Reset history navigation when user types
    if (historyIndex !== -1) {
      setHistoryIndex(-1);
      setDraftInput('');
    }
  };

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadQueue, setUploadQueue] = useState<Array<string>>([]);

  const submitForm = useCallback(() => {
    // Add to history before submitting
    addToHistory(input);

    window.history.replaceState({}, '', `/chat/${chatId}`);

    handleSubmit(undefined, {
      experimental_attachments: attachments,
    });

    setAttachments([]);
    setLocalStorageInput('');
    setGhostSuggestion('');
    setHistoryIndex(-1);
    setDraftInput('');
    resetHeight();

    if (width && width > 768) {
      textareaRef.current?.focus();
    }
  }, [
    input,
    addToHistory,
    attachments,
    handleSubmit,
    setAttachments,
    setLocalStorageInput,
    width,
    chatId,
  ]);

  const uploadFile = async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('/api/files/upload', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        const { url, pathname, contentType } = data;

        return {
          url,
          name: pathname,
          contentType: contentType,
        };
      }
      const { error } = await response.json();
      toast.error(error);
    } catch (error) {
      toast.error('Failed to upload file, please try again!');
    }
  };

  const handleFileChange = useCallback(
    async (event: ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(event.target.files || []);

      setUploadQueue(files.map((file) => file.name));

      try {
        const uploadPromises = files.map((file) => uploadFile(file));
        const uploadedAttachments = await Promise.all(uploadPromises);
        const successfullyUploadedAttachments = uploadedAttachments.filter(
          (attachment) => attachment !== undefined,
        );

        setAttachments((currentAttachments) => [
          ...currentAttachments,
          ...successfullyUploadedAttachments,
        ]);
      } catch (error) {
        console.error('Error uploading files!', error);
      } finally {
        setUploadQueue([]);
      }
    },
    [setAttachments],
  );

  const { isAtBottom, scrollToBottom } = useScrollToBottom();

  useEffect(() => {
    if (status === 'submitted') {
      scrollToBottom();
    }
  }, [status, scrollToBottom]);

  return (
    <div className="relative w-full flex flex-col gap-4">
      <AnimatePresence>
        {!isAtBottom && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            className="absolute left-1/2 bottom-28 -translate-x-1/2 z-50"
          >
            <Button
              data-testid="scroll-to-bottom-button"
              className="rounded-full"
              size="icon"
              variant="outline"
              onClick={(event) => {
                event.preventDefault();
                scrollToBottom();
              }}
            >
              <ArrowDown />
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      <input
        type="file"
        className="fixed -top-4 -left-4 size-0.5 opacity-0 pointer-events-none"
        ref={fileInputRef}
        multiple
        onChange={handleFileChange}
        tabIndex={-1}
      />

      {(attachments.length > 0 || uploadQueue.length > 0) && (
        <div
          data-testid="attachments-preview"
          className="flex flex-row gap-2 overflow-x-scroll items-end"
        >
          {attachments.map((attachment) => (
            <PreviewAttachment key={attachment.url} attachment={attachment} />
          ))}

          {uploadQueue.map((filename) => (
            <PreviewAttachment
              key={filename}
              attachment={{
                url: '',
                name: filename,
                contentType: '',
              }}
              isUploading={true}
            />
          ))}
        </div>
      )}

      <div
        className={cx(
          'relative flex flex-col gap-2 rounded-xl',
          'bg-white/20 dark:bg-neutral-900/20',
          'backdrop-blur-xl',
          'border border-white/20 dark:border-white/10',
          'shadow-[0_0_1px_1px_rgba(0,0,0,0.05)] dark:shadow-[0_0_1px_1px_rgba(255,255,255,0.05)]',
          'focus-within:border-white/30 dark:focus-within:border-white/20',
          'focus-within:shadow-[0_0_15px_2px_rgba(0,0,0,0.1)] dark:focus-within:shadow-[0_0_15px_2px_rgba(255,255,255,0.1)]',
          'transition-all duration-200'
        )}
      >
        <div className="relative">
          <Textarea
            data-testid="multimodal-input"
            ref={textareaRef}
            placeholder="Send a message..."
            value={input}
            onChange={handleInput}
            className={cx(
              'min-h-[24px] overflow-hidden resize-none rounded-xl !text-base pb-10',
              '!border-none !ring-0 !ring-offset-0 focus-visible:!ring-0 focus-visible:!ring-offset-0',
              '!bg-transparent placeholder:text-neutral-500 dark:placeholder:text-neutral-400',
              'text-neutral-800 dark:text-neutral-100',
              className,
            )}
            rows={2}
            autoFocus
            onKeyDown={(event) => {
              if (event.shiftKey && event.key === 'ArrowUp') {
                event.preventDefault();
                navigateHistory('up');
              } else if (event.shiftKey && event.key === 'ArrowDown') {
                event.preventDefault();
                navigateHistory('down');
              } else if (event.key === 'Tab' && ghostSuggestion) {
                event.preventDefault();
                acceptSuggestion();
              } else if (event.key === 'ArrowRight' && ghostSuggestion) {
                // Accept suggestion if cursor is at the end
                const textarea = event.target as HTMLTextAreaElement;
                if (textarea.selectionStart === textarea.value.length) {
                  event.preventDefault();
                  acceptSuggestion();
                }
              } else if (event.key === 'Escape') {
                setGhostSuggestion('');
                if (historyIndex !== -1) {
                  setHistoryIndex(-1);
                  setInput(draftInput);
                  setDraftInput('');
                }
              } else if (
                event.key === 'Enter' &&
                !event.shiftKey &&
                !event.nativeEvent.isComposing
              ) {
                event.preventDefault();

                if (status !== 'ready') {
                  toast.error('Please wait for the model to finish its response!');
                } else {
                  submitForm();
                }
              }
            }}
          />

          {/* Ghost text suggestion */}
          {ghostSuggestion && (
            <div
              className={cx(
                'absolute inset-0 pointer-events-none',
                'text-neutral-400 dark:text-neutral-500',
                'whitespace-pre-wrap break-words',
                'px-3 py-2 rounded-xl',
                'overflow-hidden'
              )}
              style={{
                fontFamily: 'inherit',
                fontSize: 'inherit',
                lineHeight: 'inherit',
                paddingBottom: '2.5rem',
              }}
            >
              {input}{ghostSuggestion}
            </div>
          )}
        </div>

        <div className="absolute bottom-0 p-2 w-fit flex flex-row justify-start">
          <AttachmentsButton fileInputRef={fileInputRef} status={status} />
        </div>

        <div className="absolute bottom-0 right-0 p-2 w-fit flex flex-row justify-end">
          {status === 'submitted' ? (
            <StopButton stop={stop} setMessages={setMessages} />
          ) : (
            <SendButton
              input={input}
              submitForm={submitForm}
              uploadQueue={uploadQueue}
            />
          )}
        </div>
      </div>
    </div>
  );
}

export const MultimodalInput = memo(
  PureMultimodalInput,
  (prevProps, nextProps) => {
    if (prevProps.input !== nextProps.input) return false;
    if (prevProps.status !== nextProps.status) return false;
    if (!equal(prevProps.attachments, nextProps.attachments)) return false;
    if (prevProps.selectedVisibilityType !== nextProps.selectedVisibilityType)
      return false;

    return true;
  },
);

function PureAttachmentsButton({
  fileInputRef,
  status,
}: {
  fileInputRef: React.MutableRefObject<HTMLInputElement | null>;
  status: UseChatHelpers['status'];
}) {
  return (
    <Button
      data-testid="attachments-button"
      className={cx(
        'h-8 w-8 rounded-full',
        'text-neutral-400 dark:text-neutral-500',
        'hover:text-neutral-900 dark:hover:text-neutral-100',
        'transition-all duration-200',
      )}
      onClick={(event) => {
        event.preventDefault();
        fileInputRef.current?.click();
      }}
      disabled={status !== 'ready'}
      variant="ghost"
      size="icon"
    >
      <PaperclipIcon size={14} />
    </Button>
  );
}

const AttachmentsButton = memo(PureAttachmentsButton);

function PureStopButton({
  stop,
  setMessages,
}: {
  stop: () => void;
  setMessages: UseChatHelpers['setMessages'];
}) {
  return (
    <Button
      data-testid="stop-button"
      className={cx(
        'h-8 w-8 rounded-full',
        'bg-transparent',
        'text-neutral-400 dark:text-neutral-500',
        'hover:text-neutral-900 dark:hover:text-neutral-100',
        'border-transparent',
        'transition-all duration-200',
        'backdrop-blur-sm'
      )}
      onClick={(event) => {
        event.preventDefault();
        stop();
        setMessages((messages) => messages);
      }}
      variant="ghost"
      size="icon"
    >
      <StopIcon size={14} />
    </Button>
  );
}

const StopButton = memo(PureStopButton);

function PureSendButton({
  submitForm,
  input,
  uploadQueue,
}: {
  submitForm: () => void;
  input: string;
  uploadQueue: Array<string>;
}) {
  return (
    <Button
      data-testid="send-button"
      className={cx(
        'h-8 w-8 rounded-full',
        'bg-transparent',
        'text-neutral-400 dark:text-neutral-500',
        'hover:text-neutral-900 dark:hover:text-neutral-100',
        'border-transparent',
        'transition-all duration-200',
        'backdrop-blur-sm'
      )}
      onClick={(event) => {
        event.preventDefault();
        submitForm();
      }}
      disabled={input.length === 0 || uploadQueue.length > 0}
      variant="ghost"
      size="icon"
    >
      <ArrowUpIcon size={14} />
    </Button>
  );
}

const SendButton = memo(PureSendButton, (prevProps, nextProps) => {
  if (prevProps.uploadQueue.length !== nextProps.uploadQueue.length)
    return false;
  if (prevProps.input !== nextProps.input) return false;
  return true;
});
