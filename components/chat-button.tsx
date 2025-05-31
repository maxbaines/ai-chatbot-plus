'use client';

import { useRouter } from 'next/navigation';
import { MessageCircle } from 'lucide-react';
import { Button } from './ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from './ui/tooltip';

export function ChatButton({ className }: { className?: string }) {
  const router = useRouter();

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          onClick={() => router.push('/')}
          variant="outline"
          className={`md:px-2 md:h-fit ${className || ''}`}
        >
          <MessageCircle size={16} />
        </Button>
      </TooltipTrigger>
      <TooltipContent align="start">Go to Chat</TooltipContent>
    </Tooltip>
  );
}
