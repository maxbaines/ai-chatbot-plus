import type { Message } from 'ai';
import { useCopyToClipboard } from 'usehooks-ts';

import { CopyIcon, PencilEditIcon } from './icons';
import { Button } from './ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from './ui/tooltip';
import { toast } from 'sonner';

export function UserActions({
  message,
  setMode,
}: {
  message: Message;
  setMode: (mode: 'view' | 'edit') => void;
}) {
  const [_, copyToClipboard] = useCopyToClipboard();

  return (
    <div className="flex flex-row gap-2">
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            className="py-1 px-2 h-fit text-muted-foreground"
            variant="outline"
            onClick={async () => {
              const textFromParts = message.parts
                ?.filter((part) => part.type === 'text')
                .map((part) => part.text)
                .join('\n')
                .trim();

              if (!textFromParts) {
                toast.error("There's no text to copy!");
                return;
              }

              await copyToClipboard(textFromParts);
              toast.success('Copied to clipboard!');
            }}
          >
            <CopyIcon />
          </Button>
        </TooltipTrigger>
        <TooltipContent>Copy</TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            className="py-1 px-2 h-fit text-muted-foreground"
            variant="outline"
            onClick={() => setMode('edit')}
          >
            <PencilEditIcon />
          </Button>
        </TooltipTrigger>
        <TooltipContent>Edit message</TooltipContent>
      </Tooltip>
    </div>
  );
}
