// In-memory база диалогов и сообщений (заменить на реальную БД в проде)
export interface Message {
  id: string;
  sender: string; // username
  recipient: string; // username
  text: string;
  createdAt: string;
  read: boolean;
}

export interface Conversation {
  id: string; // username1_username2 (сортированные)
  participants: [string, string];
  lastMessage?: Message;
  lastMessageTime: string;
}

// Сообщения
export const messages: Message[] = [];

// Диалоги
export const conversations: Record<string, Conversation> = {};

// Хелпер для создания ID диалога (всегда в одном порядке)
export function getConversationId(user1: string, user2: string): string {
  return [user1, user2].sort().join("_");
}

// Хелпер для инициализации диалога
export function getOrCreateConversation(user1: string, user2: string) {
  const id = getConversationId(user1, user2);
  if (!conversations[id]) {
    conversations[id] = {
      id,
      participants: [user1, user2].sort() as [string, string],
      lastMessageTime: new Date().toISOString(),
    };
  }
  return conversations[id];
}
