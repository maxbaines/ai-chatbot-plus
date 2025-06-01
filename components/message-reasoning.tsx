'use client';

import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import { Markdown } from './markdown';

interface MessageReasoningProps {
  isLoading: boolean;
  reasoning: string;
}

export function MessageReasoning({
  isLoading,
  reasoning,
}: MessageReasoningProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [streamingLine, setStreamingLine] = useState('');

  // Extract the last line of reasoning for streaming display
  const getLastLine = (text: string) => {
    if (!text) return '';
    const lines = text.trim().split('\n').filter(line => line.trim());
    return lines[lines.length - 1] || '';
  };

  // Count total lines in reasoning
  const getLineCount = (text: string) => {
    if (!text) return 0;
    return text.trim().split('\n').filter(line => line.trim()).length;
  };

  // Simulate streaming effect for the last line during loading
  useEffect(() => {
    if (!isLoading || !reasoning) return;

    const lastLine = getLastLine(reasoning);
    if (!lastLine) return;

    // Reset streaming line
    setStreamingLine('');

    // Simulate character-by-character streaming
    let currentIndex = 0;
    const interval = setInterval(() => {
      if (currentIndex <= lastLine.length) {
        setStreamingLine(lastLine.substring(0, currentIndex));
        currentIndex++;
      } else {
        clearInterval(interval);
      }
    }, 50); // Adjust speed as needed

    return () => clearInterval(interval);
  }, [isLoading, reasoning]);

  if (isLoading) {
    return (
      <div className={cn("flex items-center gap-3")}>
        {/* Reasoning Badge */}
        <div className={cn("inline-flex items-center px-2 py-1 rounded-md border text-xs font-mono font-medium")}>
          REASONING
        </div>

        {/* Streaming Last Line */}
        <div className="flex items-center">
          <div className="text-xs font-mono text-muted-foreground max-w-md truncate">
            {streamingLine}
            {streamingLine && <span className="animate-pulse">|</span>}
          </div>
        </div>
      </div>
    );
  }

  const lineCount = getLineCount(reasoning);

  return (
    <div 
      className={cn(
        "cursor-pointer transition-all duration-200 hover:opacity-80",
        isExpanded ? "flex flex-col gap-3" : "flex flex-col gap-2"
      )}
      onClick={() => setIsExpanded(!isExpanded)}
    >
      {/* Header with Reasoning Badge and Complete */}
      <div className="flex items-center gap-3">
        <div className={cn("inline-flex items-center px-2 py-1 rounded-md border text-xs font-mono font-medium")}>
          REASONING
        </div>
        <div className="text-xs text-muted-foreground font-mono">✓ Complete</div>
      </div>
      
      {/* Line Count on separate line */}
      {lineCount > 0 && (
        <div className="flex items-center gap-1 text-xs text-muted-foreground ml-0">
          <div className="w-1 h-1 rounded-full bg-blue-500"></div>
          <span className="font-mono">{lineCount} {lineCount === 1 ? 'line' : 'lines'}</span>
        </div>
      )}

      {/* Reasoning Content Display - only show when expanded */}
      {isExpanded && reasoning && (
        <div className={cn("border rounded-md font-mono text-xs")}>
          <div className="whitespace-pre-wrap overflow-hidden p-3 m-0 max-h-60 overflow-y-auto text-zinc-600 dark:text-zinc-400">
            <Markdown>{reasoning}</Markdown>
          </div>
        </div>
      )}
    </div>
  );
}
