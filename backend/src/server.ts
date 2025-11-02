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
import { errorHandler } from './shared/middleware/errorHandler';

dotenv.config();

const app = express();
const httpServer = createServer(app);

app.use(cors({
  origin: [
    'http://localhost:3001', // Frontend production port
    'http://localhost:5173', // Vite dev server
    'http://localhost:3000'  // Alternative frontend port
  ],
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const io = new SocketIOServer(httpServer, {
  cors: {
    origin: [
      'http://localhost:3001', // Frontend production port
      'http://localhost:5173', // Vite dev server
      'http://localhost:3000'  // Alternative frontend port
    ],
    credentials: true
  }
});

setupSocketIO(io);

app.use('/api/auth', authRoutes);
app.use('/api/chat', chatRoutes);

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
