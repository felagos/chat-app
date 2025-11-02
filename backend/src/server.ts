import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';

import { setupSocketIO } from './gateway/socket';
import { startSessionCleanupInterval } from './shared/services/pushNotification';
import { checkMessageQueueServiceHealth } from './shared/services/messageQueueClient';
import authRoutes from './modules/auth/routes';
import chatRoutes from './modules/chat/routes';
import usersRoutes from './modules/users/routes';
import { errorHandler } from './shared/middleware/errorHandler';

dotenv.config();

const app = express();
const httpServer = createServer(app);

app.use(cors({
  origin: function(origin, callback) {
    // Always allow the request (for development)
    callback(null, true);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const io = new SocketIOServer(httpServer, {
  cors: {
    origin: true, // Allow all origins in development
    credentials: true,
    methods: ['GET', 'POST']
  },
  transports: ['websocket', 'polling']
});

setupSocketIO(io);

app.use('/api/auth', authRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/users', usersRoutes);

app.get('/health', async (req, res) => {
  try {
    const mqHealthy = await checkMessageQueueServiceHealth();
    res.json({ 
      status: 'ok',
      messageQueueService: mqHealthy ? 'healthy' : 'unhealthy',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.json({ 
      status: 'ok',
      messageQueueService: 'unreachable',
      timestamp: new Date().toISOString()
    });
  }
});

app.get('/api/status', async (req, res) => {
  try {
    const mqHealthy = await checkMessageQueueServiceHealth();
    res.json({
      backend: 'running',
      messageQueueService: mqHealthy ? 'healthy' : 'unhealthy',
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to get status',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

app.use(errorHandler);

const PORT = parseInt(process.env.PORT || '3000', 10);

httpServer.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
  
  // Iniciar limpieza de sesiones expiradas
  startSessionCleanupInterval();
  console.log('✅ Session cleanup interval started');
});

process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully...');
  httpServer.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});
