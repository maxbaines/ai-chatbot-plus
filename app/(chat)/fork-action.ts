'use server';

import { 
  getChatById, 
  getMessagesByChatId, 
  saveChat, 
  saveMessages 
} from '@/lib/db/queries';
import { generateUUID } from '@/lib/utils';
import type { DBMessage } from '@/lib/db/schema';

export async function forkChatAction({
  chatId,
  userId,
}: {
  chatId: string;
  userId: string;
}) {
  try {
    // Get the original chat
    const originalChat = await getChatById({ id: chatId });
    if (!originalChat) {
      throw new Error('Chat not found');
    }

    // Get all messages from the original chat
    const originalMessages = await getMessagesByChatId({ id: chatId });

    // Generate new chat ID
    const newChatId = generateUUID();

    // Create the forked chat with same settings as original
    await saveChat({
      id: newChatId,
      userId,
      title: `Fork of ${originalChat.title}`,
      visibility: originalChat.visibility,
      promptId: originalChat.promptId,
      modelId: originalChat.modelId,
    });

    // Copy all messages to the new chat if there are any
    if (originalMessages.length > 0) {
      const newMessages: Array<DBMessage> = originalMessages.map((message) => ({
        ...message,
        id: generateUUID(), // Generate new ID for each message
        chatId: newChatId, // Associate with new chat
        createdAt: new Date(), // Use current timestamp for forked messages
      }));

      await saveMessages({ messages: newMessages });
    }

    // Return the new chat ID instead of redirecting
    return { success: true, newChatId };
  } catch (error) {
    console.error('Failed to fork chat:', error);
    throw new Error('Failed to fork chat');
  }
}
