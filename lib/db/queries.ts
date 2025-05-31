import 'server-only';

import {
  and,
  asc,
  count,
  desc,
  eq,
  gt,
  gte,
  inArray,
  isNotNull,
  lt,
  like,
  or,
  sql,
  type SQL,
} from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';

import {
  user,
  chat,
  type User,
  document,
  type Suggestion,
  suggestion,
  message,
  vote,
  type DBMessage,
  type Chat,
  stream,
  prompt,
  type Prompt,
  mcpServer,
  type MCPServer,
} from './schema';
import type { ArtifactKind } from '@/components/artifact';
import { generateUUID } from '../utils';
import { generateHashedPassword } from './utils';
import type { VisibilityType } from '@/components/visibility-selector';
import { ChatSDKError } from '../errors';

// Optionally, if not using email/pass login, you can
// use the Drizzle adapter for Auth.js / NextAuth
// https://authjs.dev/reference/adapter/drizzle

// biome-ignore lint: Forbidden non-null assertion.
const client = postgres(process.env.POSTGRES_URL!);
const db = drizzle(client);

export async function getUser(email: string): Promise<Array<User>> {
  try {
    return await db.select().from(user).where(eq(user.email, email));
  } catch (error) {
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to get user by email',
    );
  }
}

export async function createUser(email: string, password: string) {
  const hashedPassword = generateHashedPassword(password);

  try {
    const [newUser] = await db.insert(user).values({ email, password: hashedPassword }).returning({
      id: user.id,
      email: user.email,
    });

    // Seed default prompts for the new user
    await seedDefaultPromptsForUser({ userId: newUser.id });

    return [newUser];
  } catch (error) {
    throw new ChatSDKError('bad_request:database', 'Failed to create user');
  }
}

export async function createGuestUser() {
  const email = `guest-${Date.now()}`;
  const password = generateHashedPassword(generateUUID());

  try {
    const [newUser] = await db.insert(user).values({ email, password }).returning({
      id: user.id,
      email: user.email,
    });

    // Seed default prompts for the new guest user
    await seedDefaultPromptsForUser({ userId: newUser.id });

    return [newUser];
  } catch (error) {
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to create guest user',
    );
  }
}

export async function saveChat({
  id,
  userId,
  title,
  visibility,
  promptId,
  modelId,
}: {
  id: string;
  userId: string;
  title: string;
  visibility: VisibilityType;
  promptId?: string | null;
  modelId?: string | null;
}) {
  try {
    return await db.insert(chat).values({
      id,
      createdAt: new Date(),
      userId,
      title,
      visibility,
      promptId,
      modelId,
    });
  } catch (error) {
    throw new ChatSDKError('bad_request:database', 'Failed to save chat');
  }
}

export async function deleteChatById({ id }: { id: string }) {
  try {
    await db.delete(vote).where(eq(vote.chatId, id));
    await db.delete(message).where(eq(message.chatId, id));
    await db.delete(stream).where(eq(stream.chatId, id));

    const [chatsDeleted] = await db
      .delete(chat)
      .where(eq(chat.id, id))
      .returning();
    return chatsDeleted;
  } catch (error) {
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to delete chat by id',
    );
  }
}

export async function getChatsByUserId({
  id,
  limit,
  startingAfter,
  endingBefore,
}: {
  id: string;
  limit: number;
  startingAfter: string | null;
  endingBefore: string | null;
}) {
  try {
    const extendedLimit = limit + 1;

    const query = (whereCondition?: SQL<any>) =>
      db
        .select()
        .from(chat)
        .where(
          whereCondition
            ? and(whereCondition, eq(chat.userId, id))
            : eq(chat.userId, id),
        )
        .orderBy(desc(chat.createdAt))
        .limit(extendedLimit);

    let filteredChats: Array<Chat> = [];

    if (startingAfter) {
      const [selectedChat] = await db
        .select()
        .from(chat)
        .where(eq(chat.id, startingAfter))
        .limit(1);

      if (!selectedChat) {
        throw new ChatSDKError(
          'not_found:database',
          `Chat with id ${startingAfter} not found`,
        );
      }

      filteredChats = await query(gt(chat.createdAt, selectedChat.createdAt));
    } else if (endingBefore) {
      const [selectedChat] = await db
        .select()
        .from(chat)
        .where(eq(chat.id, endingBefore))
        .limit(1);

      if (!selectedChat) {
        throw new ChatSDKError(
          'not_found:database',
          `Chat with id ${endingBefore} not found`,
        );
      }

      filteredChats = await query(lt(chat.createdAt, selectedChat.createdAt));
    } else {
      filteredChats = await query();
    }

    const hasMore = filteredChats.length > limit;

    return {
      chats: hasMore ? filteredChats.slice(0, limit) : filteredChats,
      hasMore,
    };
  } catch (error) {
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to get chats by user id',
    );
  }
}

export async function getChatById({ id }: { id: string }) {
  try {
    const [selectedChat] = await db.select().from(chat).where(eq(chat.id, id));
    return selectedChat;
  } catch (error) {
    throw new ChatSDKError('bad_request:database', 'Failed to get chat by id');
  }
}

export async function saveMessages({
  messages,
}: {
  messages: Array<DBMessage>;
}) {
  try {
    return await db.insert(message).values(messages);
  } catch (error) {
    throw new ChatSDKError('bad_request:database', 'Failed to save messages');
  }
}

export async function getMessagesByChatId({ id }: { id: string }) {
  try {
    return await db
      .select()
      .from(message)
      .where(eq(message.chatId, id))
      .orderBy(asc(message.createdAt));
  } catch (error) {
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to get messages by chat id',
    );
  }
}

export async function voteMessage({
  chatId,
  messageId,
  type,
}: {
  chatId: string;
  messageId: string;
  type: 'up' | 'down';
}) {
  try {
    const [existingVote] = await db
      .select()
      .from(vote)
      .where(and(eq(vote.messageId, messageId)));

    if (existingVote) {
      return await db
        .update(vote)
        .set({ isUpvoted: type === 'up' })
        .where(and(eq(vote.messageId, messageId), eq(vote.chatId, chatId)));
    }
    return await db.insert(vote).values({
      chatId,
      messageId,
      isUpvoted: type === 'up',
    });
  } catch (error) {
    throw new ChatSDKError('bad_request:database', 'Failed to vote message');
  }
}

export async function getVotesByChatId({ id }: { id: string }) {
  try {
    return await db.select().from(vote).where(eq(vote.chatId, id));
  } catch (error) {
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to get votes by chat id',
    );
  }
}

export async function saveDocument({
  id,
  title,
  kind,
  content,
  userId,
}: {
  id: string;
  title: string;
  kind: ArtifactKind;
  content: string;
  userId: string;
}) {
  try {
    return await db
      .insert(document)
      .values({
        id,
        title,
        kind,
        content,
        userId,
        createdAt: new Date(),
      })
      .returning();
  } catch (error) {
    throw new ChatSDKError('bad_request:database', 'Failed to save document');
  }
}

export async function getDocumentsById({ id }: { id: string }) {
  try {
    const documents = await db
      .select()
      .from(document)
      .where(eq(document.id, id))
      .orderBy(asc(document.createdAt));

    return documents;
  } catch (error) {
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to get documents by id',
    );
  }
}

export async function getDocumentById({ id }: { id: string }) {
  try {
    const [selectedDocument] = await db
      .select()
      .from(document)
      .where(eq(document.id, id))
      .orderBy(desc(document.createdAt));

    return selectedDocument;
  } catch (error) {
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to get document by id',
    );
  }
}

export async function deleteDocumentsByIdAfterTimestamp({
  id,
  timestamp,
}: {
  id: string;
  timestamp: Date;
}) {
  try {
    await db
      .delete(suggestion)
      .where(
        and(
          eq(suggestion.documentId, id),
          gt(suggestion.documentCreatedAt, timestamp),
        ),
      );

    return await db
      .delete(document)
      .where(and(eq(document.id, id), gt(document.createdAt, timestamp)))
      .returning();
  } catch (error) {
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to delete documents by id after timestamp',
    );
  }
}

export async function saveSuggestions({
  suggestions,
}: {
  suggestions: Array<Suggestion>;
}) {
  try {
    return await db.insert(suggestion).values(suggestions);
  } catch (error) {
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to save suggestions',
    );
  }
}

export async function getSuggestionsByDocumentId({
  documentId,
}: {
  documentId: string;
}) {
  try {
    return await db
      .select()
      .from(suggestion)
      .where(and(eq(suggestion.documentId, documentId)));
  } catch (error) {
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to get suggestions by document id',
    );
  }
}

export async function getMessageById({ id }: { id: string }) {
  try {
    return await db.select().from(message).where(eq(message.id, id));
  } catch (error) {
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to get message by id',
    );
  }
}

export async function deleteMessagesByChatIdAfterTimestamp({
  chatId,
  timestamp,
}: {
  chatId: string;
  timestamp: Date;
}) {
  try {
    const messagesToDelete = await db
      .select({ id: message.id })
      .from(message)
      .where(
        and(eq(message.chatId, chatId), gte(message.createdAt, timestamp)),
      );

    const messageIds = messagesToDelete.map((message) => message.id);

    if (messageIds.length > 0) {
      await db
        .delete(vote)
        .where(
          and(eq(vote.chatId, chatId), inArray(vote.messageId, messageIds)),
        );

      return await db
        .delete(message)
        .where(
          and(eq(message.chatId, chatId), inArray(message.id, messageIds)),
        );
    }
  } catch (error) {
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to delete messages by chat id after timestamp',
    );
  }
}

export async function updateChatVisiblityById({
  chatId,
  visibility,
}: {
  chatId: string;
  visibility: 'private' | 'public';
}) {
  try {
    return await db.update(chat).set({ visibility }).where(eq(chat.id, chatId));
  } catch (error) {
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to update chat visibility by id',
    );
  }
}

export async function updateChatPromptId({
  chatId,
  promptId,
}: {
  chatId: string;
  promptId: string | null;
}) {
  try {
    return await db.update(chat).set({ promptId }).where(eq(chat.id, chatId));
  } catch (error) {
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to update chat prompt id',
    );
  }
}

export async function updateChatModelId({
  chatId,
  modelId,
}: {
  chatId: string;
  modelId: string | null;
}) {
  try {
    return await db.update(chat).set({ modelId }).where(eq(chat.id, chatId));
  } catch (error) {
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to update chat model id',
    );
  }
}

export async function getMessageCountByUserId({
  id,
  differenceInHours,
}: { id: string; differenceInHours: number }) {
  try {
    const twentyFourHoursAgo = new Date(
      Date.now() - differenceInHours * 60 * 60 * 1000,
    );

    const [stats] = await db
      .select({ count: count(message.id) })
      .from(message)
      .innerJoin(chat, eq(message.chatId, chat.id))
      .where(
        and(
          eq(chat.userId, id),
          gte(message.createdAt, twentyFourHoursAgo),
          eq(message.role, 'user'),
        ),
      )
      .execute();

    return stats?.count ?? 0;
  } catch (error) {
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to get message count by user id',
    );
  }
}

export async function createStreamId({
  streamId,
  chatId,
}: {
  streamId: string;
  chatId: string;
}) {
  try {
    await db
      .insert(stream)
      .values({ id: streamId, chatId, createdAt: new Date() });
  } catch (error) {
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to create stream id',
    );
  }
}

export async function getStreamIdsByChatId({ chatId }: { chatId: string }) {
  try {
    const streamIds = await db
      .select({ id: stream.id })
      .from(stream)
      .where(eq(stream.chatId, chatId))
      .orderBy(asc(stream.createdAt))
      .execute();

    return streamIds.map(({ id }) => id);
  } catch (error) {
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to get stream ids by chat id',
    );
  }
}

// Prompt CRUD operations

export async function createPrompt({
  name,
  description,
  content,
  type,
  isDefault = false,
  userId,
}: {
  name: string;
  description: string;
  content: string;
  type: 'chat' | 'code' | 'name' | 'custom';
  isDefault?: boolean;
  userId: string;
}) {
  try {
    const now = new Date();
    return await db
      .insert(prompt)
      .values({
        name,
        description,
        content,
        type,
        isDefault,
        userId,
        createdAt: now,
        updatedAt: now,
      })
      .returning();
  } catch (error) {
    throw new ChatSDKError('bad_request:database', 'Failed to create prompt');
  }
}

export async function getPromptsByUserId({
  userId,
  searchTerm,
  type,
}: {
  userId: string;
  searchTerm?: string;
  type?: 'chat' | 'code' | 'name' | 'custom' | 'all';
}) {
  try {
    let whereConditions = and(
      eq(prompt.userId, userId),
      eq(prompt.isDeleted, false)
    );

    // Add search filter if provided
    if (searchTerm) {
      const searchCondition = or(
        like(prompt.name, `%${searchTerm}%`),
        like(prompt.description, `%${searchTerm}%`)
      );
      whereConditions = and(whereConditions, searchCondition);
    }

    // Add type filter if provided and not 'all'
    if (type && type !== 'all') {
      whereConditions = and(whereConditions, eq(prompt.type, type));
    }

    return await db
      .select()
      .from(prompt)
      .where(whereConditions)
      .orderBy(desc(prompt.updatedAt));
  } catch (error) {
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to get prompts by user id',
    );
  }
}

export async function getPromptById({ id }: { id: string }) {
  try {
    const [selectedPrompt] = await db
      .select()
      .from(prompt)
      .where(and(eq(prompt.id, id), eq(prompt.isDeleted, false)));
    return selectedPrompt;
  } catch (error) {
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to get prompt by id',
    );
  }
}

export async function updatePrompt({
  id,
  name,
  description,
  content,
  type,
}: {
  id: string;
  name: string;
  description: string;
  content: string;
  type: 'chat' | 'code' | 'name' | 'custom';
}) {
  try {
    return await db
      .update(prompt)
      .set({
        name,
        description,
        content,
        type,
        updatedAt: new Date(),
      })
      .where(and(eq(prompt.id, id), eq(prompt.isDeleted, false)))
      .returning();
  } catch (error) {
    throw new ChatSDKError('bad_request:database', 'Failed to update prompt');
  }
}

export async function softDeletePrompt({ id }: { id: string }) {
  try {
    return await db
      .update(prompt)
      .set({
        isDeleted: true,
        deletedAt: new Date(),
      })
      .where(eq(prompt.id, id))
      .returning();
  } catch (error) {
    throw new ChatSDKError('bad_request:database', 'Failed to delete prompt');
  }
}

export async function duplicatePrompt({
  id,
  userId,
  newName,
}: {
  id: string;
  userId: string;
  newName: string;
}) {
  try {
    // First get the original prompt
    const [originalPrompt] = await db
      .select()
      .from(prompt)
      .where(and(eq(prompt.id, id), eq(prompt.isDeleted, false)));

    if (!originalPrompt) {
      throw new ChatSDKError('not_found:database', 'Prompt not found');
    }

    // Create the duplicate
    const now = new Date();
    return await db
      .insert(prompt)
      .values({
        name: newName,
        description: originalPrompt.description,
        content: originalPrompt.content,
        type: originalPrompt.type,
        isDefault: false, // Duplicates are never default
        userId,
        usageCount: 0, // Reset usage count
        createdAt: now,
        updatedAt: now,
      })
      .returning();
  } catch (error) {
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to duplicate prompt',
    );
  }
}

export async function incrementPromptUsage({ id }: { id: string }) {
  try {
    return await db
      .update(prompt)
      .set({
        usageCount: sql`${prompt.usageCount} + 1`,
      })
      .where(and(eq(prompt.id, id), eq(prompt.isDeleted, false)));
  } catch (error) {
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to increment prompt usage',
    );
  }
}

export async function seedDefaultPromptsForUser({ userId }: { userId: string }) {
  try {
    const now = new Date();
    const defaultPrompts = [
      {
        name: 'Default Chat Prompt',
        description: 'Standard conversational AI assistant prompt',
        content:
          'You are a helpful, harmless, and honest AI assistant. Provide clear, accurate, and helpful responses to user queries.',
        type: 'chat' as const,
        isDefault: true,
        userId,
        createdAt: now,
        updatedAt: now,
      },
      {
        name: 'Default Code Prompt',
        description: 'Programming and development assistance prompt',
        content:
          'You are an expert software developer. Help users with coding questions, provide clean code examples, explain concepts clearly, and follow best practices.',
        type: 'code' as const,
        isDefault: true,
        userId,
        createdAt: now,
        updatedAt: now,
      },
      {
        name: 'Default Name Prompt',
        description: 'Creative naming and branding assistance',
        content:
          'You are a creative naming expert. Help users generate memorable, relevant, and catchy names for their projects, products, or ideas.',
        type: 'name' as const,
        isDefault: true,
        userId,
        createdAt: now,
        updatedAt: now,
      },
    ];

    return await db.insert(prompt).values(defaultPrompts).returning();
  } catch (error) {
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to seed default prompts for user',
    );
  }
}

// MCP Server CRUD operations

export async function createMCPServer({
  name,
  description,
  url,
  type,
  command,
  args,
  env,
  headers,
  sandboxUrl,
  enabled = false,
  streaming = false,
  userId,
}: {
  name: string;
  description?: string;
  url: string;
  type: 'sse' | 'stdio';
  command?: string;
  args?: string[];
  env?: Array<{ key: string; value: string }>;
  headers?: Array<{ key: string; value: string }>;
  sandboxUrl?: string;
  enabled?: boolean;
  streaming?: boolean;
  userId: string;
}) {
  try {
    const now = new Date();
    return await db
      .insert(mcpServer)
      .values({
        name,
        description,
        url,
        type,
        command,
        args,
        env,
        headers,
        sandboxUrl,
        enabled,
        streaming,
        userId,
        createdAt: now,
        updatedAt: now,
      })
      .returning();
  } catch (error) {
    throw new ChatSDKError('bad_request:database', 'Failed to create MCP server');
  }
}

export async function getMCPServersByUserId({
  userId,
  searchTerm,
  type,
  status,
}: {
  userId: string;
  searchTerm?: string;
  type?: 'sse' | 'stdio' | 'all';
  status?: 'connected' | 'disconnected' | 'connecting' | 'error' | 'all';
}) {
  try {
    const conditions = [eq(mcpServer.userId, userId)];

    // Add type filter if provided and not 'all'
    if (type && type !== 'all') {
      conditions.push(eq(mcpServer.type, type));
    }

    // Add status filter if provided and not 'all'
    if (status && status !== 'all') {
      conditions.push(eq(mcpServer.status, status));
    }

    return await db
      .select()
      .from(mcpServer)
      .where(and(...conditions))
      .orderBy(desc(mcpServer.updatedAt));
  } catch (error) {
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to get MCP servers by user id',
    );
  }
}

export async function getMCPServerById({ id }: { id: string }) {
  try {
    const [selectedServer] = await db
      .select()
      .from(mcpServer)
      .where(eq(mcpServer.id, id));
    return selectedServer;
  } catch (error) {
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to get MCP server by id',
    );
  }
}

export async function updateMCPServer({
  id,
  name,
  description,
  url,
  type,
  command,
  args,
  env,
  headers,
  sandboxUrl,
  streaming,
}: {
  id: string;
  name: string;
  description?: string;
  url: string;
  type: 'sse' | 'stdio';
  command?: string;
  args?: string[];
  env?: Array<{ key: string; value: string }>;
  headers?: Array<{ key: string; value: string }>;
  sandboxUrl?: string;
  streaming?: boolean;
}) {
  try {
    return await db
      .update(mcpServer)
      .set({
        name,
        description,
        url,
        type,
        command,
        args,
        env,
        headers,
        sandboxUrl,
        streaming,
        updatedAt: new Date(),
      })
      .where(eq(mcpServer.id, id))
      .returning();
  } catch (error) {
    throw new ChatSDKError('bad_request:database', 'Failed to update MCP server');
  }
}

export async function deleteMCPServer({ id }: { id: string }) {
  try {
    return await db
      .delete(mcpServer)
      .where(eq(mcpServer.id, id))
      .returning();
  } catch (error) {
    throw new ChatSDKError('bad_request:database', 'Failed to delete MCP server');
  }
}

export async function duplicateMCPServer({
  id,
  userId,
  newName,
}: {
  id: string;
  userId: string;
  newName: string;
}) {
  try {
    // First get the original server
    const [originalServer] = await db
      .select()
      .from(mcpServer)
      .where(eq(mcpServer.id, id));

    if (!originalServer) {
      throw new ChatSDKError('not_found:database', 'MCP server not found');
    }

    // Create the duplicate
    const now = new Date();
    return await db
      .insert(mcpServer)
      .values({
        name: newName,
        description: originalServer.description,
        url: originalServer.url,
        type: originalServer.type,
        command: originalServer.command,
        args: originalServer.args,
        env: originalServer.env,
        headers: originalServer.headers,
        sandboxUrl: originalServer.sandboxUrl,
        status: 'disconnected', // Reset status for duplicate
        userId,
        createdAt: now,
        updatedAt: now,
      })
      .returning();
  } catch (error) {
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to duplicate MCP server',
    );
  }
}

export async function updateMCPServerStatus({
  id,
  status,
  errorMessage,
}: {
  id: string;
  status: 'connected' | 'disconnected' | 'connecting' | 'error';
  errorMessage?: string;
}) {
  try {
    return await db
      .update(mcpServer)
      .set({
        status,
        errorMessage,
        updatedAt: new Date(),
      })
      .where(eq(mcpServer.id, id))
      .returning();
  } catch (error) {
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to update MCP server status',
    );
  }
}

export async function updateMCPServerEnabled({
  id,
  enabled,
}: {
  id: string;
  enabled: boolean;
}) {
  try {
    return await db
      .update(mcpServer)
      .set({
        enabled,
        updatedAt: new Date(),
      })
      .where(eq(mcpServer.id, id))
      .returning();
  } catch (error) {
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to update MCP server enabled status',
    );
  }
}

export async function getEnabledMCPServersByUserId({ userId }: { userId: string }) {
  try {
    return await db
      .select()
      .from(mcpServer)
      .where(and(eq(mcpServer.userId, userId), eq(mcpServer.enabled, true)))
      .orderBy(desc(mcpServer.updatedAt));
  } catch (error) {
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to get enabled MCP servers by user id',
    );
  }
}
