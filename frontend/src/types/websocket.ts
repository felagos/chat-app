/**
 * WebSocket Events Const Object
 * Shared between frontend and backend for type-safe socket communication
 */

export const WebSocketEvent = {
  // Client to Server Events (Frontend emits)
  MESSAGE_SEND: 'message:send' as const,
  TYPING_START: 'typing:start' as const,
  TYPING_STOP: 'typing:stop' as const,
  CONVERSATION_JOIN: 'conversation:join' as const,
  CONVERSATION_LEAVE: 'conversation:leave' as const,

  // Server to Client Events (Backend emits)
  MESSAGE_RECEIVED: 'message:received' as const,
  USER_TYPING: 'user:typing' as const,
  USER_STOPPED_TYPING: 'user:stopped-typing' as const,
  USER_JOINED: 'user:joined' as const,
  USER_LEFT: 'user:left' as const,
  USER_ONLINE: 'user:online' as const,
  USER_OFFLINE: 'user:offline' as const,

  // Connection Events
  CONNECT: 'connect' as const,
  DISCONNECT: 'disconnect' as const,
  CONNECT_ERROR: 'connect_error' as const,
  ERROR: 'error' as const,
} as const;

export type WebSocketEventType = typeof WebSocketEvent[keyof typeof WebSocketEvent];

/**
 * WebSocket Event Payloads Interface
 * Defines the structure of data sent with each event
 */
export interface WebSocketPayloads {
  // Client to Server
  [WebSocketEvent.MESSAGE_SEND]: { conversationId: string; content: string };
  [WebSocketEvent.TYPING_START]: { conversationId: string };
  [WebSocketEvent.TYPING_STOP]: { conversationId: string };
  [WebSocketEvent.CONVERSATION_JOIN]: { conversationId: string };
  [WebSocketEvent.CONVERSATION_LEAVE]: { conversationId: string };

  // Server to Client
  [WebSocketEvent.MESSAGE_RECEIVED]: {
    id: string;
    conversationId: string;
    senderId: string;
    content: string;
    type: 'text' | 'image' | 'video' | 'file';
    mediaUrl?: string;
    timestamp: Date;
    status: 'sent' | 'delivered' | 'read';
    readBy: string[];
  };
  [WebSocketEvent.USER_TYPING]: { userId: string; conversationId: string };
  [WebSocketEvent.USER_STOPPED_TYPING]: { userId: string; conversationId: string };
  [WebSocketEvent.USER_JOINED]: { userId: string };
  [WebSocketEvent.USER_LEFT]: { userId: string };
  [WebSocketEvent.USER_ONLINE]: { userId: string; timestamp: number };
  [WebSocketEvent.USER_OFFLINE]: { userId: string; timestamp: number };

  // Connection Events
  [WebSocketEvent.CONNECT]: void;
  [WebSocketEvent.DISCONNECT]: void;
  [WebSocketEvent.CONNECT_ERROR]: Error;
  [WebSocketEvent.ERROR]: { message: string };
}
