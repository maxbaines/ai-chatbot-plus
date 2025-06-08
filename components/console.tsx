import { TerminalWindowIcon, LoaderIcon, CrossSmallIcon } from './icons';
import { Button } from './ui/button';
import {
  Dispatch,
  SetStateAction,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';
import { cn } from '@/lib/utils';
import { useArtifactSelector } from '@/hooks/use-artifact';
import DataGrid from 'react-data-grid';
import { useTheme } from 'next-themes';

import 'react-data-grid/lib/styles.css';

function ConsoleContentRenderer({ content }: { content: ConsoleOutputContent }) {
  const { theme } = useTheme();

  if (content.type === 'image') {
    return (
      <picture>
        <img
          src={content.value as string}
          alt="output"
          className="rounded-md max-w-screen-toast-mobile w-full"
        />
      </picture>
    );
  }

  if (content.type === 'table') {
    const tableData = content.value as { headers: string[]; rows: string[][] };
    
    // Calculate dynamic column width based on available space
    const columnCount = tableData.headers.length;
    const minColumnWidth = 150;
    
    // Use auto width with minimum constraints
    const columns = tableData.headers.map((header, index) => ({
      key: index.toString(),
      name: header,
      width: 'auto' as const,
      minWidth: minColumnWidth,
      resizable: true,
      sortable: true,
      cellClass: cn('border-t bg-card text-card-foreground', {
        'border-l': index !== 0,
      }),
      headerCellClass: cn('border-t bg-muted text-muted-foreground', {
        'border-l': index !== 0,
      }),
    }));

    const rows = tableData.rows.map((row, rowIndex) => {
      const rowData: any = { id: rowIndex };
      row.forEach((cell, cellIndex) => {
        rowData[cellIndex.toString()] = cell;
      });
      return rowData;
    });

    // Calculate height to show more rows but cap at reasonable limit
    const maxDisplayRows = 15;
    const rowHeight = 35;
    const headerHeight = 35;
    const displayRows = Math.min(rows.length, maxDisplayRows);
    const tableHeight = displayRows * rowHeight + headerHeight;

    return (
      <div className="w-full overflow-auto">
        <DataGrid
          className={cn(
            theme?.includes('-dark') ? 'rdg-dark' : 'rdg-light',
            'w-full'
          )}
          columns={columns}
          rows={rows}
          style={{ 
            height: tableHeight,
            width: '100%',
            minWidth: columnCount * minColumnWidth
          }}
          defaultColumnOptions={{
            minWidth: minColumnWidth,
            resizable: true,
            sortable: true,
          }}
          enableVirtualization={rows.length > 50}
        />
      </div>
    );
  }

  // Default text rendering
  return (
    <div className="whitespace-pre-line break-words w-full">
      {content.value as string}
    </div>
  );
}

function ConsoleOutputContent({ contents, activeTab }: { contents: ConsoleOutputContent[], activeTab: string }) {
  // Group contents by type
  const textContents = contents.filter(content => content.type === 'text');
  const tableContents = contents.filter(content => content.type === 'table');
  const imageContents = contents.filter(content => content.type === 'image');

  // If only one type of content, render directly
  if (textContents.length + tableContents.length + imageContents.length <= 1) {
    return (
      <div className="flex flex-col gap-2">
        {contents.map((content, index) => (
          <ConsoleContentRenderer
            key={index}
            content={content}
          />
        ))}
      </div>
    );
  }

  // Render content based on active tab
  let contentToRender: ConsoleOutputContent[] = [];
  if (activeTab === 'text') {
    contentToRender = textContents;
  } else if (activeTab === 'table') {
    contentToRender = tableContents;
  } else if (activeTab === 'image') {
    contentToRender = imageContents;
  }

  return (
    <div className="flex flex-col gap-2">
      {contentToRender.map((content, index) => (
        <ConsoleContentRenderer
          key={index}
          content={content}
        />
      ))}
    </div>
  );
}

function ConsoleTabButtons({ contents, activeTab, onTabChange }: { 
  contents: ConsoleOutputContent[], 
  activeTab: string, 
  onTabChange: (tab: string) => void 
}) {
  // Group contents by type
  const textContents = contents.filter(content => content.type === 'text');
  const tableContents = contents.filter(content => content.type === 'table');
  const imageContents = contents.filter(content => content.type === 'image');

  // Determine available tabs
  const availableTabs = [];
  if (textContents.length > 0) availableTabs.push('text');
  if (tableContents.length > 0) availableTabs.push('table');
  if (imageContents.length > 0) availableTabs.push('image');

  // Don't show tabs if only one type of content
  if (availableTabs.length <= 1) {
    return null;
  }

  return (
    <div className="flex gap-1">
      {availableTabs.includes('text') && (
        <Button
          variant={activeTab === 'text' ? 'outline' : 'ghost'}
          size="sm"
          className="h-6 px-2"
          onClick={() => onTabChange('text')}
        >
          Text
        </Button>
      )}
      {availableTabs.includes('table') && (
        <Button
          variant={activeTab === 'table' ? 'outline' : 'ghost'}
          size="sm"
          className="h-6 px-2"
          onClick={() => onTabChange('table')}
        >
          Table
        </Button>
      )}
      {availableTabs.includes('image') && (
        <Button
          variant={activeTab === 'image' ? 'outline' : 'ghost'}
          size="sm"
          className="h-6 px-2"
          onClick={() => onTabChange('image')}
        >
          Image
        </Button>
      )}
    </div>
  );
}

export interface ConsoleOutputContent {
  type: 'text' | 'image' | 'table';
  value: string | { headers: string[]; rows: string[][] };
}

export interface ConsoleOutput {
  id: string;
  status: 'in_progress' | 'loading_packages' | 'completed' | 'failed';
  contents: Array<ConsoleOutputContent>;
}

interface ConsoleProps {
  consoleOutputs: Array<ConsoleOutput>;
  setConsoleOutputs: Dispatch<SetStateAction<Array<ConsoleOutput>>>;
}

export function Console({ consoleOutputs, setConsoleOutputs }: ConsoleProps) {
  const [height, setHeight] = useState<number>(300);
  const [isResizing, setIsResizing] = useState(false);
  const [activeTabs, setActiveTabs] = useState<Record<string, string>>({});
  const consoleEndRef = useRef<HTMLDivElement>(null);

  const isArtifactVisible = useArtifactSelector((state) => state.isVisible);

  const minHeight = 100;
  const maxHeight = 800;

  const startResizing = useCallback(() => {
    setIsResizing(true);
  }, []);

  const stopResizing = useCallback(() => {
    setIsResizing(false);
  }, []);

  const resize = useCallback(
    (e: MouseEvent) => {
      if (isResizing) {
        const newHeight = window.innerHeight - e.clientY;
        if (newHeight >= minHeight && newHeight <= maxHeight) {
          setHeight(newHeight);
        }
      }
    },
    [isResizing],
  );

  useEffect(() => {
    window.addEventListener('mousemove', resize);
    window.addEventListener('mouseup', stopResizing);
    return () => {
      window.removeEventListener('mousemove', resize);
      window.removeEventListener('mouseup', stopResizing);
    };
  }, [resize, stopResizing]);

  useEffect(() => {
    consoleEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [consoleOutputs]);

  useEffect(() => {
    if (!isArtifactVisible) {
      setConsoleOutputs([]);
    }
  }, [isArtifactVisible, setConsoleOutputs]);

  return consoleOutputs.length > 0 ? (
    <>
      <div
        className="h-2 w-full fixed cursor-ns-resize z-50"
        onMouseDown={startResizing}
        style={{ bottom: height - 4 }}
        role="slider"
        aria-valuenow={minHeight}
      />

      <div
        className={cn(
          'fixed flex flex-col bottom-0 bg-background w-full border-t z-40 overflow-y-scroll overflow-x-hidden border-border',
          {
            'select-none': isResizing,
          },
        )}
        style={{ height }}
      >
        <div className="flex flex-row justify-between items-center w-full h-fit border-b border-border px-2 py-1 sticky top-0 z-50 bg-muted">
          <div className="text-sm pl-2 text-foreground flex flex-row gap-3 items-center">
            <div className="text-muted-foreground">
              <TerminalWindowIcon />
            </div>
            <div>Console</div>
            {consoleOutputs.length > 0 && consoleOutputs[0].status === 'completed' && (
              <ConsoleTabButtons
                contents={consoleOutputs[0].contents}
                activeTab={activeTabs[consoleOutputs[0].id] || (() => {
                  const textContents = consoleOutputs[0].contents.filter(content => content.type === 'text');
                  const tableContents = consoleOutputs[0].contents.filter(content => content.type === 'table');
                  const imageContents = consoleOutputs[0].contents.filter(content => content.type === 'image');
                  return tableContents.length > 0 ? 'table' : (textContents.length > 0 ? 'text' : 'image');
                })()}
                onTabChange={(tab) => setActiveTabs(prev => ({ ...prev, [consoleOutputs[0].id]: tab }))}
              />
            )}
          </div>
          <Button
            variant="ghost"
            className="size-fit p-1"
            size="icon"
            onClick={() => setConsoleOutputs([])}
          >
            <CrossSmallIcon />
          </Button>
        </div>

        <div>
          {consoleOutputs.map((consoleOutput, index) => (
            <div
              key={consoleOutput.id}
              className="px-4 py-2 flex flex-row text-sm border-b border-border bg-background font-mono"
            >
              <div
                className={cn('w-12 shrink-0', {
                  'text-muted-foreground': [
                    'in_progress',
                    'loading_packages',
                  ].includes(consoleOutput.status),
                  'text-emerald-500': consoleOutput.status === 'completed',
                  'text-red-400': consoleOutput.status === 'failed',
                })}
              >
                [{index + 1}]
              </div>
              {['in_progress', 'loading_packages'].includes(
                consoleOutput.status,
              ) ? (
                <div className="flex flex-row gap-2">
                  <div className="animate-spin size-fit self-center mb-auto mt-0.5">
                    <LoaderIcon />
                  </div>
                  <div className="text-muted-foreground">
                    {consoleOutput.status === 'in_progress'
                      ? 'Initializing...'
                      : consoleOutput.status === 'loading_packages'
                        ? consoleOutput.contents
                            .filter((content) => content.type === 'text')
                            .map((content) => content.value as string)
                            .join(' ')
                        : null}
                  </div>
                </div>
              ) : (
                <div className="text-foreground w-full flex flex-col gap-2 overflow-x-auto">
                  <ConsoleOutputContent 
                    contents={consoleOutput.contents} 
                    activeTab={activeTabs[consoleOutput.id] || (() => {
                      const textContents = consoleOutput.contents.filter(content => content.type === 'text');
                      const tableContents = consoleOutput.contents.filter(content => content.type === 'table');
                      const imageContents = consoleOutput.contents.filter(content => content.type === 'image');
                      return tableContents.length > 0 ? 'table' : (textContents.length > 0 ? 'text' : 'image');
                    })()} 
                  />
                </div>
              )}
            </div>
          ))}
          <div ref={consoleEndRef} />
        </div>
      </div>
    </>
  ) : null;
}
