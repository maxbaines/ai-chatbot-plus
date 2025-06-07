import { z } from 'zod';
import { streamObject } from 'ai';
import { myProvider } from '@/lib/ai/providers';
import { pglitePrompt, updateDocumentPrompt } from '@/lib/ai/prompts';
import { createDocumentHandler } from '@/lib/artifacts/server';

export const pgliteDocumentHandler = createDocumentHandler<'pglite'>({
  kind: 'pglite',
  onCreateDocument: async ({ title, dataStream }) => {
    let draftContent = '';

    const { fullStream } = streamObject({
      model: myProvider.languageModel('artifact-model'),
      system: pglitePrompt,
      prompt: title,
      schema: z.object({
        sql: z.string().describe('PostgreSQL SQL code'),
      }),
    });

    for await (const delta of fullStream) {
      const { type } = delta;

      if (type === 'object') {
        const { object } = delta;
        const { sql } = object;

        if (sql) {
          dataStream.writeData({
            type: 'pglite-delta',
            content: sql ?? '',
          });

          draftContent = sql;
        }
      }
    }

    return draftContent;
  },
  onUpdateDocument: async ({ document, description, dataStream }) => {
    let draftContent = '';

    const { fullStream } = streamObject({
      model: myProvider.languageModel('artifact-model'),
      system: updateDocumentPrompt(document.content, 'pglite'),
      prompt: description,
      schema: z.object({
        sql: z.string().describe('PostgreSQL SQL code'),
      }),
    });

    for await (const delta of fullStream) {
      const { type } = delta;

      if (type === 'object') {
        const { object } = delta;
        const { sql } = object;

        if (sql) {
          dataStream.writeData({
            type: 'pglite-delta',
            content: sql ?? '',
          });

          draftContent = sql;
        }
      }
    }

    return draftContent;
  },
});
