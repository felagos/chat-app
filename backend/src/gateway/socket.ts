import { Server as SocketIOServer, Socket } from 'socket.io';
import { authenticate } from '../shared/middleware/auth.js';
import { publishMessage } from '../shared/services/rabbitmq.js';

interface AuthenticatedSocket extends Socket {
  userId?: string;
}

export const setupSocketIO = (io: SocketIOServer): void => {
  // Middleware to authenticate socket connections
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      if (!token) {
        return next(new Error('Authentication token missing'));
      }

      // In production, verify the token properly
      // For now, we'll just extract userId from the token
      const userId = socket.handshake.auth.userId;
      if (!userId) {
        return next(new Error('UserId missing'));
      }

      (socket as AuthenticatedSocket).userId = userId;
      next();
    } catch (error) {
      next(new Error('Authentication failed'));
    }
  });

  // Connection event
  io.on('connection', (socket: AuthenticatedSocket) => {
    const userId = socket.userId;
    console.log(`✅ User ${userId} connected via WebSocket`);

    // User joins their personal room
    socket.join(`user:${userId}`);

    // Broadcast user is online
    io.emit('user:online', { userId, timestamp: Date.now() });

    // Handle new message
    socket.on('message:send', async (data: { conversationId: string; content: string }) => {
      try {
        // Publish to RabbitMQ for async processing
        await publishMessage('chat', 'message.new', {
          conversationId: data.conversationId,
          userId,
          content: data.content,
          timestamp: Date.now()
        });

        // Emit to conversation room
        socket.to(`conversation:${data.conversationId}`).emit('message:received', {
          conversationId: data.conversationId,
          userId,
          content: data.content,
          timestamp: Date.now()
        });
      } catch (error) {
        socket.emit('error', { message: 'Failed to send message' });
      }
    });

    // Handle typing indicator
    socket.on('typing:start', (data: { conversationId: string }) => {
      socket.to(`conversation:${data.conversationId}`).emit('user:typing', { userId });
    });

    socket.on('typing:stop', (data: { conversationId: string }) => {
      socket.to(`conversation:${data.conversationId}`).emit('user:stopped-typing', { userId });
    });

    // Join conversation room
    socket.on('conversation:join', (data: { conversationId: string }) => {
      socket.join(`conversation:${data.conversationId}`);
      socket.to(`conversation:${data.conversationId}`).emit('user:joined', { userId });
    });

    // Leave conversation room
    socket.on('conversation:leave', (data: { conversationId: string }) => {
      socket.leave(`conversation:${data.conversationId}`);
      socket.to(`conversation:${data.conversationId}`).emit('user:left', { userId });
    });

    // Handle disconnect
    socket.on('disconnect', () => {
      console.log(`❌ User ${userId} disconnected`);
      io.emit('user:offline', { userId, timestamp: Date.now() });
    });
  });
};
