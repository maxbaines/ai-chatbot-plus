'use client';

import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import { SparklesIcon } from './icons';
import { useChatLayout } from '@/hooks/use-chat-layout';

export const ThinkingMessage = () => {
  const role = 'assistant';
  const { layout } = useChatLayout();
  
  // Binary stream animation state
  const [binaryStream, setBinaryStream] = useState<string[]>([]);
  const [currentMessage, setCurrentMessage] = useState('Processing...');
  
  // Creative thinking messages
  const thinkingMessages = [
    'Processing...',
    'Analyzing...',
    'Thinking...',
    'Computing...',
    'Considering...',
    'Evaluating...',
    'Synthesizing...',
    'Reasoning...',
    'Calculating...'
  ];
  
  // Generate and update binary stream with thinking-related injections
  useEffect(() => {
    const generateBinary = () => (Math.random() > 0.5 ? '1' : '0');
    
    // Thinking-related words to inject
    const thinkingWords = ['AI', 'ML', 'THINK', 'PROC', 'EVAL', 'COMP', 'SYNC'];
    let nextWordTime = Date.now() + Math.random() * 2000 + 1000; // 1-3 seconds
    
    const shouldInjectWord = () => {
      if (Date.now() >= nextWordTime) {
        nextWordTime = Date.now() + Math.random() * 2000 + 1000; // Reset timer
        return thinkingWords[Math.floor(Math.random() * thinkingWords.length)];
      }
      return null;
    };
    
    // Update binary stream
    const streamInterval = setInterval(() => {
      setBinaryStream((prev) => {
        const newStream = [...prev];
        if (newStream.length > 8) newStream.shift();
        
        const wordToInject = shouldInjectWord();
        if (wordToInject && Math.random() > 0.7) {
          newStream.push(wordToInject);
        } else {
          newStream.push(generateBinary());
        }
        
        return newStream;
      });
    }, 250);
    
    // Update thinking message
    const messageInterval = setInterval(() => {
      setCurrentMessage(thinkingMessages[Math.floor(Math.random() * thinkingMessages.length)]);
    }, 1500);
    
    // Initialize stream
    setBinaryStream(Array(8).fill('').map(generateBinary));
    
    return () => {
      clearInterval(streamInterval);
      clearInterval(messageInterval);
    };
  }, []);
  
  // Render binary stream items with thinking word highlighting
  const renderStreamItem = (item: string, index: number) => {
    const isThinkingWord = item.length > 1;
    
    if (isThinkingWord) {
      return (
        <span
          key={`stream-${index}`}
          className="text-xs font-medium text-blue-500 font-mono"
          style={{
            opacity: 0.9,
            transform: 'scale(1.1)',
          }}
        >
          {item}
        </span>
      );
    }
    
    return (
      <span
        key={`stream-${index}`}
        className={cn(
          'text-xs font-mono transition-all duration-300',
          item === '1' ? 'text-blue-500' : 'text-blue-400/70'
        )}
        style={{
          opacity: 0.4 + index * 0.08,
          transform: `scale(${0.8 + index * 0.03})`,
        }}
      >
        {item}
      </span>
    );
  };

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
            <motion.div 
              className="absolute left-0 top-0 size-6 flex items-center rounded-full justify-center ring-1 shrink-0 ring-border bg-background"
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            >
              <div className="translate-y-px">
                <SparklesIcon size={14} />
              </div>
            </motion.div>
            <div className="ml-12">
              <div className="flex items-center gap-3 text-muted-foreground">
                <span className="text-sm font-mono">{currentMessage}</span>
                <div className="flex items-center gap-1">
                  {binaryStream.map((item, index) => renderStreamItem(item, index))}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <>
            <motion.div 
              className="size-8 flex items-center rounded-full justify-center ring-1 shrink-0 ring-border bg-background"
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            >
              <div className="translate-y-px">
                <SparklesIcon size={14} />
              </div>
            </motion.div>
            <div className="flex flex-col gap-2 w-full">
              <div className="flex items-center gap-3 text-muted-foreground">
                <span className="text-sm font-mono">{currentMessage}</span>
                <div className="flex items-center gap-1">
                  {binaryStream.map((item, index) => renderStreamItem(item, index))}
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </motion.div>
  );
};
