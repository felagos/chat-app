import { create } from 'zustand';
import { apiClient } from '../lib/api';
import { useAuthStore } from './authStore';
import type { Message, Conversation } from '../types';

interface ChatState {
  conversations: Conversation[];
  messages: Record<string, Message[]>;
  activeConversationId: string | null;
  typingUsers: Record<string, string[]>;
  onlineUsers: Set<string>;
  loading: boolean;

  setConversations: (conversations: Conversation[]) => void;
  addConversation: (conversation: Conversation) => void;
  updateConversation: (id: string, updates: Partial<Conversation>) => void;
  setMessages: (conversationId: string, messages: Message[]) => void;
  addMessage: (message: Message) => void;
  setActiveConversation: (id: string | null) => void;
  setTyping: (conversationId: string, userId: string, isTyping: boolean) => void;
  setUserOnline: (userId: string) => void;
  setUserOffline: (userId: string) => void;
  setLoading: (loading: boolean) => void;
  createConversation: (username: string) => Promise<void>;
  createGroup: (groupName: string, participantUsernames: string[]) => Promise<void>;
  deleteConversation: (id: string) => Promise<void>;
}

export const useChatStore = create<ChatState>((set) => ({
  conversations: [],
  messages: {},
  activeConversationId: null,
  typingUsers: {},
  onlineUsers: new Set<string>(),
  loading: false,

  setConversations: (conversations: Conversation[]) =>
    set({ conversations }),

  addConversation: (conversation: Conversation) =>
    set((state) => ({
      conversations: [conversation, ...state.conversations],
    })),

  updateConversation: (id: string, updates: Partial<Conversation>) =>
    set((state) => ({
      conversations: state.conversations.map((conv) =>
        conv.id === id ? { ...conv, ...updates } : conv
      ),
    })),

  setMessages: (conversationId: string, messages: Message[]) =>
    set((state) => ({
      messages: {
        ...state.messages,
        [conversationId]: messages,
      },
    })),

  addMessage: (message: Message) =>
    set((state) => {
      const convId = message.conversationId;
      const existing = state.messages[convId] || [];
      return {
        messages: {
          ...state.messages,
          [convId]: [...existing, message],
        },
      };
    }),

  setActiveConversation: (id: string | null) =>
    set({ activeConversationId: id }),

  setTyping: (conversationId: string, userId: string, isTyping: boolean) =>
    set((state) => {
      const current = state.typingUsers[conversationId] || [];
      const updated = isTyping
        ? current.includes(userId)
          ? current
          : [...current, userId]
        : current.filter((id) => id !== userId);

      return {
        typingUsers: {
          ...state.typingUsers,
          [conversationId]: updated,
        },
      };
    }),

  deleteConversation: async (id: string) => {
    try {
      const token = useAuthStore.getState().token;
      if (!token) return;
      await apiClient.delete(`/chat/${id}`, token);
      set((state) => ({
        conversations: state.conversations.filter((c) => c.id !== id),
        activeConversationId: state.activeConversationId === id ? null : state.activeConversationId,
        messages: Object.fromEntries(Object.entries(state.messages).filter(([k]) => k !== id)),
      }));
    } catch (error) {
      console.error('Error deleting conversation:', error);
    }
  },

  setUserOnline: (userId: string) =>
    set((state) => ({ onlineUsers: new Set([...state.onlineUsers, userId]) })),

  setUserOffline: (userId: string) =>
    set((state) => {
      const next = new Set(state.onlineUsers);
      next.delete(userId);
      return { onlineUsers: next };
    }),

  setLoading: (loading: boolean) => set({ loading }),

  createConversation: async (username: string) => {
    try {
      const token = useAuthStore.getState().token;
      if (!token) {
        console.error('No authentication token');
        return;
      }
      
      const response = await apiClient.post('/chat', { username }, token);
      const conversation = response;
      
      set((state) => ({
        conversations: [conversation, ...state.conversations],
        activeConversationId: conversation.id,
      }));
    } catch (error) {
      console.error('Error creating conversation:', error);
    }
  },

  createGroup: async (groupName: string, participantUsernames: string[]) => {
    try {
      const token = useAuthStore.getState().token;
      if (!token) {
        console.error('No authentication token');
        return;
      }

      // Buscar IDs de los participantes
      const participantIds: string[] = [];
      for (const username of participantUsernames) {
        try {
          const userResponse = await apiClient.get(`/users/search?username=${username}`, token);
          // Si es un array, tomar el primer resultado
          if (Array.isArray(userResponse) && userResponse.length > 0) {
            participantIds.push(userResponse[0].id);
          } else if (userResponse?.id) {
            participantIds.push(userResponse.id);
          }
        } catch {
          console.warn(`Usuario ${username} no encontrado`);
        }
      }

      const response = await apiClient.post(
        '/chat',
        {
          name: groupName,
          type: 'group',
          participantIds,
        },
        token
      );
      const conversation = response;

      set((state) => ({
        conversations: [conversation, ...state.conversations],
        activeConversationId: conversation.id,
      }));
    } catch (error) {
      console.error('Error creating group:', error);
    }
  },
}));
