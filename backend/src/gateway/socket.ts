import jwt from 'jsonwebtoken';
import { Server as SocketIOServer, Socket } from 'socket.io';
import { publishMessage } from '../shared/services/rabbitmq';
import { WebSocketEvent } from '../shared/types/websocket';
import {
  markUserAsActive,
  markUserAsInactive
} from '../shared/services/pushNotification';

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  throw new Error('JWT_SECRET environment variable is required');
}

interface AuthenticatedSocket extends Socket {
  userId?: string;
}

export const setupSocketIO = (io: SocketIOServer): void => {
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      if (!token) {
        return next(new Error('Authentication token missing'));
      }

      const decoded = jwt.verify(token, JWT_SECRET) as { id: string; email: string };
      (socket as AuthenticatedSocket).userId = decoded.id;
      next();
    } catch (error) {
      next(new Error('Invalid or expired token'));
    }
  });

  io.on('connection', (socket: AuthenticatedSocket) => {
    const userId = socket.userId;
    console.log(`✅ User ${userId} connected via WebSocket`);

    markUserAsActive(userId!, socket.id);

    socket.join(`user:${userId}`);

    io.emit(WebSocketEvent.USER_ONLINE, { userId, timestamp: Date.now() });

    socket.on(WebSocketEvent.MESSAGE_SEND, async (data: { conversationId: string; content: string }) => {
      try {
        console.log(`📨 [${userId}] Sending message to conversation ${data.conversationId}`);

        const tempMessage = {
          id: `temp-${Date.now()}`,
          conversationId: data.conversationId,
          userId,
          content: data.content,
          status: 'sent',
          createdAt: new Date().toISOString(),
        };

        // Emit to other conversation participants immediately (optimistic)
        socket.to(`conversation:${data.conversationId}`).emit(WebSocketEvent.MESSAGE_RECEIVED, tempMessage);

        // Persist asynchronously via RabbitMQ
        await publishMessage('chat', 'message.new', {
          conversationId: data.conversationId,
          userId,
          content: data.content,
          timestamp: Date.now()
        });

        console.log(`✅ [${userId}] Message queued for persistence`);
      } catch (error) {
        console.error(`❌ [${userId}] Failed to send message:`, error);
        socket.emit(WebSocketEvent.ERROR, { 
          message: 'Failed to send message',
          details: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    });

    socket.on(WebSocketEvent.TYPING_START, (data: { conversationId: string }) => {
      socket.to(`conversation:${data.conversationId}`).emit(WebSocketEvent.USER_TYPING, { userId, conversationId: data.conversationId });
    });

    socket.on(WebSocketEvent.TYPING_STOP, (data: { conversationId: string }) => {
      socket.to(`conversation:${data.conversationId}`).emit(WebSocketEvent.USER_STOPPED_TYPING, { userId, conversationId: data.conversationId });
    });

    socket.on(WebSocketEvent.CONVERSATION_JOIN, (data: { conversationId: string }) => {
      socket.join(`conversation:${data.conversationId}`);
      socket.to(`conversation:${data.conversationId}`).emit(WebSocketEvent.USER_JOINED, { userId });
    });

    socket.on(WebSocketEvent.CONVERSATION_LEAVE, (data: { conversationId: string }) => {
      socket.leave(`conversation:${data.conversationId}`);
      socket.to(`conversation:${data.conversationId}`).emit(WebSocketEvent.USER_LEFT, { userId });
    });

    socket.on(WebSocketEvent.DISCONNECT, () => {
      console.log(`❌ User ${userId} disconnected`);
      // Marcar usuario como inactivo
      markUserAsInactive(userId!);
      io.emit(WebSocketEvent.USER_OFFLINE, { userId, timestamp: Date.now() });
    });
  });
};
