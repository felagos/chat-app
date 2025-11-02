export interface User {
  id: string;
  username: string;
  email: string;
  avatar?: string;
  status: 'ONLINE' | 'OFFLINE' | 'AWAY';
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  type: 'text' | 'image' | 'video' | 'file';
  mediaUrl?: string;
  timestamp: Date;
  status: 'sent' | 'delivered' | 'read';
  readBy: string[];
}

export interface Conversation {
  id: string;
  type: 'direct' | 'group';
  participants: User[];
  name?: string;
  avatar?: string;
  lastMessage?: Message;
  lastMessageAt?: Date;
  unreadCount: number;
  createdAt: Date;
}

export interface AuthResponse {
  user: User;
  token: string;
}

export interface CreateMessagePayload {
  conversationId: string;
  content: string;
  type: 'text' | 'image' | 'video' | 'file';
  mediaUrl?: string;
}

export interface CreateConversationPayload {
  type: 'direct' | 'group';
  participantIds: string[];
  name?: string;
}
