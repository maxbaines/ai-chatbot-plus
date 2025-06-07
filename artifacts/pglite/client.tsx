import { Artifact } from '@/components/create-artifact';
import { CodeEditor } from '@/components/code-editor';
import {
  CopyIcon,
  TerminalIcon,
  MessageIcon,
  PlayIcon,
  RedoIcon,
  UndoIcon,
  TrashIcon,
} from '@/components/icons';
import { toast } from 'sonner';
import { generateUUID } from '@/lib/utils';
import {
  Console,
  ConsoleOutput,
  ConsoleOutputContent,
} from '@/components/console';
import { PGlite } from '@electric-sql/pglite';
import { useState, useCallback } from 'react';

interface PGliteQueryResult {
  fields: Array<{ name: string }>;
  rows: Array<Record<string, unknown>>;
  command?: string;
  rowCount?: number;
}


interface Metadata {
  outputs: Array<ConsoleOutput>;
  pgliteInstance: PGlite | null;
}

export const pgliteArtifact = new Artifact<'pglite', Metadata>({
  kind: 'pglite',
  description:
    'Useful for PostgreSQL database operations; Execute SQL queries using PGlite in-browser PostgreSQL.',
  initialize: async ({ setMetadata }) => {
    setMetadata({
      outputs: [],
      pgliteInstance: null,
    });
  },
  onStreamPart: ({ streamPart, setArtifact }) => {
    if (streamPart.type === 'pglite-delta') {
      setArtifact((draftArtifact) => ({
        ...draftArtifact,
        content: streamPart.content as string,
        isVisible:
          draftArtifact.status === 'streaming' &&
          draftArtifact.content.length > 300 &&
          draftArtifact.content.length < 310
            ? true
            : draftArtifact.isVisible,
        status: 'streaming',
      }));
    }
  },
  content: ({ metadata, setMetadata, ...props }) => {
    return (
      <>
        <div className="px-1">
          <CodeEditor {...props} />
        </div>

        {metadata?.outputs && (
          <Console
            consoleOutputs={metadata.outputs}
            setConsoleOutputs={() => {
              setMetadata({
                ...metadata,
                outputs: [],
              });
            }}
          />
        )}
      </>
    );
  },
  actions: [
    {
      icon: <PlayIcon size={18} />,
      label: 'Run SQL',
      description: 'Execute SQL query',
      onClick: async ({ content, metadata, setMetadata }) => {
        const runId = generateUUID();
        const outputContent: Array<ConsoleOutputContent> = [];

        setMetadata((metadata) => ({
          ...metadata,
          outputs: [
            {
              id: runId,
              contents: [],
              status: 'in_progress',
            },
          ],
        }));

        try {
          let currentPglite = metadata.pgliteInstance;
          if (!currentPglite) {
            currentPglite = new PGlite();
            setMetadata((prev) => ({
              ...prev,
              pgliteInstance: currentPglite,
            }));
          }

          const result = (await currentPglite.exec(content)) as PGliteQueryResult[];

          // Format result for display
          result.forEach((r) => {
            // Add command summary
            outputContent.push({
              type: 'text',
              value: `${r.command ?? 'Query'} - ${
                r.rowCount ?? r.rows.length
              } rows affected`,
            });

            // Add table output if there are rows
            if (r.rows.length > 0) {
              const headers = r.fields.map((f) => f.name);
              const rows = r.rows.map((row) =>
                headers.map((field) =>
                  String((row as Record<string, unknown>)[field] ?? '')
                )
              );
              
              outputContent.push({
                type: 'table',
                value: { headers, rows },
              });
            }
          });

          setMetadata((metadata) => ({
            ...metadata,
            outputs: [
              {
                id: runId,
                contents: outputContent,
                status: 'completed',
              },
            ],
          }));
        } catch (error: any) {
          const errorMessage =
            error instanceof Error ? error.message : String(error);
          setMetadata((metadata) => ({
            ...metadata,
            outputs: [
              {
                id: runId,
                contents: [{ type: 'text', value: `Error: ${errorMessage}` }],
                status: 'failed',
              },
            ],
          }));
        }
      },
    },
    {
      icon: <TrashIcon size={18} />,
      label: 'Clear DB',
      description: 'Reset database',
      onClick: async ({ metadata, setMetadata }) => {
        setMetadata((metadata) => ({
          ...metadata,
          pgliteInstance: null,
          outputs: [
            ...metadata.outputs,
            {
              id: generateUUID(),
              contents: [{ type: 'text', value: 'Database reset successfully' }],
              status: 'completed',
            },
          ],
        }));
        toast.success('Database reset!');
      },
    },
    {
      icon: <UndoIcon size={18} />,
      description: 'View Previous version',
      onClick: ({ handleVersionChange }) => {
        handleVersionChange('prev');
      },
      isDisabled: ({ currentVersionIndex }) => {
        if (currentVersionIndex === 0) {
          return true;
        }
        return false;
      },
    },
    {
      icon: <RedoIcon size={18} />,
      description: 'View Next version',
      onClick: ({ handleVersionChange }) => {
        handleVersionChange('next');
      },
      isDisabled: ({ isCurrentVersion }) => {
        if (isCurrentVersion) {
          return true;
        }
        return false;
      },
    },
    {
      icon: <CopyIcon size={18} />,
      description: 'Copy SQL to clipboard',
      onClick: ({ content }) => {
        navigator.clipboard.writeText(content);
        toast.success('Copied to clipboard!');
      },
    },
  ],
  toolbar: [
    {
      icon: <MessageIcon />,
      description: 'Add comments',
      onClick: ({ appendMessage }) => {
        appendMessage({
          role: 'user',
          content: 'Please update this SQL document by adding helpful comments to explain what each part of the query does.',
        });
      },
    },
    {
      icon: <TerminalIcon />,
      description: 'Optimize query',
      onClick: ({ appendMessage }) => {
        appendMessage({
          role: 'user',
          content: 'Please update this SQL document by optimizing the query for better performance and explaining the improvements.',
        });
      },
    },
  ],
});
