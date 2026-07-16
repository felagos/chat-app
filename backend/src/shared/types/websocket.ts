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
  CONVERSATION_CREATED: 'conversation:created' as const,

  // Connection Events
  CONNECT: 'connect' as const,
  DISCONNECT: 'disconnect' as const,
  CONNECT_ERROR: 'connect_error' as const,
  ERROR: 'error' as const,
} as const;

