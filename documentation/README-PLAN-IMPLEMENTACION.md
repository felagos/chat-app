# Plan de Implementación - Aplicación de Chat

## Tabla de Contenidos
1. [Visión General](#visión-general)
2. [Stack Tecnológico](#stack-tecnológico)
3. [Fases de Implementación](#fases-de-implementación)
4. [Backend - Plan Detallado](#backend---plan-detallado)
5. [Frontend - Plan Detallado](#frontend---plan-detallado)
6. [DevOps y Deployment](#devops-y-deployment)
7. [Testing](#testing)
8. [Timeline Estimado](#timeline-estimado)

---

## Visión General

Este documento describe un plan de implementación completo y estructurado para desarrollar una aplicación de chat moderna, escalable y con características en tiempo real.

### Objetivos
- Crear una aplicación de chat funcional con mensajería en tiempo real
- Arquitectura escalable y mantenible
- Experiencia de usuario fluida en web y móvil
- Sistema seguro y confiable

---

## Stack Tecnológico

### Backend
- **Runtime**: Bun 1.0+ / TypeScript
- **Framework**: Express.js
- **WebSocket**: Socket.io
- **Base de Datos**: 
  - MongoDB (mensajes y conversaciones)
  - Redis (caché y sesiones)
  - PostgreSQL (usuarios y autenticación)
- **Message Queue**: RabbitMQ
- **Authentication**: JWT + Passport.js
- **Storage**: AWS S3 / CloudFlare R2
- **ORM**: Mongoose (MongoDB), Prisma (PostgreSQL)

### Frontend Web
- **Framework**: React 18+ / Next.js 14+
- **Language**: TypeScript
- **State Management**: Zustand
- **WebSocket Client**: Socket.io-client
- **UI Styling**: Sass (SCSS)
- **Forms**: React Hook Form + Zod
- **HTTP Client**: TanStack Query (React Query)

### Frontend Mobile (Opcional)
- **Framework**: React Native
- **Navigation**: React Navigation
- **State**: Zustand

### DevOps
- **Containerization**: Docker + Docker Compose

---

## Fases de Implementación

### Fase 1: Setup y Fundamentos (Semana 1-2)
- Configuración de proyecto y monorepo
- Setup de bases de datos
- Sistema de autenticación básico
- API REST inicial

### Fase 2: Mensajería Básica (Semana 3-4)
- WebSocket server
- Mensajes 1-a-1
- Historial de mensajes
- UI básico de chat

### Fase 3: Características Intermedias (Semana 5-6)
- Chats grupales
- Estado de presencia
- Typing indicators
- Confirmaciones de lectura

### Fase 4: Multimedia y Avanzado (Semana 7-8)
- Upload de archivos
- Imágenes y videos
- Notificaciones push
- Búsqueda de mensajes

### Fase 5: Optimización y Producción (Semana 9-10)
- Performance optimization
- Testing completo
- Deployment
- Monitoring y logging

---

## Backend - Plan Detallado

### 1. Setup Inicial del Proyecto

#### Estructura de Directorios
```
backend/
├── src/
│   ├── config/          # Configuraciones
│   ├── modules/
│   │   ├── auth/        # Autenticación
│   │   ├── users/       # Gestión de usuarios
│   │   ├── chat/        # Lógica de chat
│   │   ├── messages/    # Mensajes
│   │   ├── presence/    # Estado de presencia
│   │   └── media/       # Archivos multimedia
│   ├── shared/
│   │   ├── middleware/  # Middleware común
│   │   ├── guards/      # Guards de autenticación
│   │   ├── decorators/  # Decoradores personalizados
│   │   └── utils/       # Utilidades
│   ├── database/
│   │   ├── models/      # Modelos de datos
│   │   └── migrations/  # Migraciones
│   ├── gateway/         # WebSocket gateway
│   └── main.ts          # Entry point
├── tests/
├── docker-compose.yml
├── Dockerfile
├── package.json
└── tsconfig.json
```

#### Comandos de Inicio
```bash
# Crear proyecto
mkdir backend && cd backend
bun init -y

# Instalar dependencias principales
bun add express @types/express
bun add socket.io
bun add mongoose ioredis
bun add jsonwebtoken @types/jsonwebtoken
bun add amqplib @types/amqplib
bun add dotenv cors helmet compression
bun add passport passport-jwt @types/passport-jwt

# Instalar dependencias de desarrollo
bun add -d @types/node
bun add -d bun-types
bun add -d nodemon
```

### 2. Módulo de Autenticación

#### 2.1 Modelo de Usuario (PostgreSQL/Prisma)
```typescript
// prisma/schema.prisma
model User {
  id            String    @id @default(uuid())
  username      String    @unique
  email         String    @unique
  passwordHash  String
  avatar        String?
  status        UserStatus @default(OFFLINE)
  lastSeen      DateTime?
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
  
  conversations ConversationParticipant[]
  messages      Message[]
}

enum UserStatus {
  ONLINE
  OFFLINE
  AWAY
}
```

#### 2.2 Controlador de Autenticación
```typescript
// src/modules/auth/auth.controller.ts
import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { prisma } from '../../database/client';

export class AuthController {
  async register(req: Request, res: Response) {
    try {
      const { username, email, password } = req.body;
      
      // Hash password usando Bun
      const passwordHash = await Bun.password.hash(password);
      
      // Crear usuario
      const user = await prisma.user.create({
        data: { username, email, passwordHash }
      });
      
      // Generar token
      const token = jwt.sign(
        { userId: user.id },
        process.env.JWT_SECRET!,
        { expiresIn: '7d' }
      );
      
      res.json({ token, user: { id: user.id, username, email } });
    } catch (error) {
      res.status(500).json({ error: 'Registration failed' });
    }
  }
  
  async login(req: Request, res: Response) {
    try {
      const { email, password } = req.body;
      
      const user = await prisma.user.findUnique({ where: { email } });
      if (!user) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }
      
      // Verificar password con Bun
      const isValid = await Bun.password.verify(password, user.passwordHash);
      if (!isValid) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }
      
      const token = jwt.sign(
        { userId: user.id },
        process.env.JWT_SECRET!,
        { expiresIn: '7d' }
      );
      
      res.json({ token, user: { id: user.id, username: user.username, email } });
    } catch (error) {
      res.status(500).json({ error: 'Login failed' });
    }
  }
}
```

#### 2.3 Middleware de Autenticación
```typescript
// src/shared/middleware/auth.middleware.ts
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export interface AuthRequest extends Request {
  userId?: string;
}

export const authMiddleware = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token provided' });
  }
  
  const token = authHeader.split(' ')[1];
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string };
    req.userId = decoded.userId;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
};
```

### 3. Módulo de Chat - WebSocket

#### 3.1 WebSocket Gateway con Socket.io
```typescript
// src/gateway/chat.gateway.ts
import { Server, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { RedisService } from '../shared/services/redis.service';
import { RabbitMQService } from '../shared/services/rabbitmq.service';

export class ChatGateway {
  private io: Server;
  private redisService: RedisService;
  private rabbitMQService: RabbitMQService;
  
  constructor(server: any) {
    this.io = new Server(server, {
      cors: { origin: process.env.CLIENT_URL }
    });
    this.redisService = new RedisService();
    this.rabbitMQService = new RabbitMQService();
    this.setupMiddleware();
    this.setupEventHandlers();
  }
  
  private setupMiddleware() {
    this.io.use(async (socket: Socket, next) => {
      const token = socket.handshake.auth.token;
      
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string };
        socket.data.userId = decoded.userId;
        next();
      } catch (error) {
        next(new Error('Authentication error'));
      }
    });
  }
  
  private setupEventHandlers() {
    this.io.on('connection', (socket: Socket) => {
      console.log(`User connected: ${socket.data.userId}`);
      
      // Unirse a sala personal
      socket.join(`user:${socket.data.userId}`);
      
      // Actualizar estado de presencia
      this.updatePresence(socket.data.userId, 'online');
      
      // Escuchar eventos
      socket.on('send_message', (data) => this.handleSendMessage(socket, data));
      socket.on('join_conversation', (data) => this.handleJoinConversation(socket, data));
      socket.on('typing', (data) => this.handleTyping(socket, data));
      socket.on('disconnect', () => this.handleDisconnect(socket));
    });
  }
  
  private async handleSendMessage(socket: Socket, data: any) {
    const { conversationId, content, type } = data;
    
    const message = {
      id: crypto.randomUUID(),
      conversationId,
      senderId: socket.data.userId,
      content,
      type,
      timestamp: new Date()
    };
    
    // Publicar mensaje en RabbitMQ para procesamiento asíncrono
    await this.rabbitMQService.publishMessage('messages', message);
    
    // Emitir a otros participantes en tiempo real
    socket.to(`conversation:${conversationId}`).emit('new_message', message);
  }
  
  private handleJoinConversation(socket: Socket, data: any) {
    const { conversationId } = data;
    socket.join(`conversation:${conversationId}`);
  }
  
  private handleTyping(socket: Socket, data: any) {
    const { conversationId, isTyping } = data;
    socket.to(`conversation:${conversationId}`).emit('user_typing', {
      userId: socket.data.userId,
      isTyping
    });
  }
  
  private async handleDisconnect(socket: Socket) {
    await this.updatePresence(socket.data.userId, 'offline');
  }
  
  private async updatePresence(userId: string, status: string) {
    await this.redisService.set(`presence:${userId}`, status, 300);
    this.io.emit('presence_update', { userId, status });
  }
}
```

### 4. Modelos de Datos MongoDB

#### 4.1 Modelo de Conversación
```typescript
// src/database/models/conversation.model.ts
import mongoose from 'mongoose';

const conversationSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['direct', 'group'],
    required: true
  },
  participants: [{
    type: String, // User IDs
    required: true
  }],
  name: String, // Para grupos
  avatar: String,
  lastMessageAt: Date,
  createdAt: {
    type: Date,
    default: Date.now
  }
});

conversationSchema.index({ participants: 1 });

export const Conversation = mongoose.model('Conversation', conversationSchema);
```

#### 4.2 Modelo de Mensaje
```typescript
// src/database/models/message.model.ts
import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema({
  conversationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Conversation',
    required: true,
    index: true
  },
  senderId: {
    type: String,
    required: true,
    index: true
  },
  content: String,
  type: {
    type: String,
    enum: ['text', 'image', 'video', 'file', 'audio'],
    default: 'text'
  },
  mediaUrl: String,
  status: {
    type: String,
    enum: ['sent', 'delivered', 'read'],
    default: 'sent'
  },
  readBy: [String],
  replyTo: mongoose.Schema.Types.ObjectId,
  reactions: {
    type: Map,
    of: [String]
  },
  timestamp: {
    type: Date,
    default: Date.now,
    index: true
  }
});

messageSchema.index({ conversationId: 1, timestamp: -1 });

export const Message = mongoose.model('Message', messageSchema);
```

### 5. Servicios

#### 5.1 Message Service
```typescript
// src/modules/messages/message.service.ts
import { Message } from '../../database/models/message.model';
import { RedisService } from '../../shared/services/redis.service';

export class MessageService {
  private redisService: RedisService;
  
  constructor() {
    this.redisService = new RedisService();
  }
  
  async createMessage(data: any) {
    const message = await Message.create(data);
    
    // Cachear en Redis
    await this.cacheRecentMessage(message);
    
    return message;
  }
  
  async getMessages(conversationId: string, limit = 50, before?: Date) {
    // Intentar obtener de caché primero
    const cached = await this.getCachedMessages(conversationId);
    if (cached && !before) {
      return cached;
    }
    
    // Obtener de DB
    const query: any = { conversationId };
    if (before) {
      query.timestamp = { $lt: before };
    }
    
    const messages = await Message.find(query)
      .sort({ timestamp: -1 })
      .limit(limit);
    
    return messages.reverse();
  }
  
  async markAsRead(messageId: string, userId: string) {
    await Message.updateOne(
      { _id: messageId },
      { 
        $addToSet: { readBy: userId },
        $set: { status: 'read' }
      }
    );
  }
  
  private async cacheRecentMessage(message: any) {
    const key = `messages:${message.conversationId}:recent`;
    await this.redisService.lpush(key, JSON.stringify(message));
    await this.redisService.ltrim(key, 0, 49); // Mantener solo 50
    await this.redisService.expire(key, 3600); // 1 hora
  }
  
  private async getCachedMessages(conversationId: string) {
    const key = `messages:${conversationId}:recent`;
    const cached = await this.redisService.lrange(key, 0, -1);
    return cached.map(msg => JSON.parse(msg));
  }
}
```

#### 5.2 Conversation Service
```typescript
// src/modules/chat/conversation.service.ts
import { Conversation } from '../../database/models/conversation.model';

export class ConversationService {
  async createDirectConversation(userId1: string, userId2: string) {
    // Verificar si ya existe
    const existing = await Conversation.findOne({
      type: 'direct',
      participants: { $all: [userId1, userId2] }
    });
    
    if (existing) return existing;
    
    // Crear nueva
    return await Conversation.create({
      type: 'direct',
      participants: [userId1, userId2]
    });
  }
  
  async createGroupConversation(name: string, participants: string[]) {
    return await Conversation.create({
      type: 'group',
      name,
      participants
    });
  }
  
  async getUserConversations(userId: string) {
    return await Conversation.find({
      participants: userId
    }).sort({ lastMessageAt: -1 });
  }
  
  async addParticipant(conversationId: string, userId: string) {
    await Conversation.updateOne(
      { _id: conversationId },
      { $addToSet: { participants: userId } }
    );
  }
}
```

### 6. API Routes

#### 6.1 Auth Routes
```typescript
// src/modules/auth/auth.routes.ts
import { Router } from 'express';
import { AuthController } from './auth.controller';

const router = Router();
const authController = new AuthController();

router.post('/register', (req, res) => authController.register(req, res));
router.post('/login', (req, res) => authController.login(req, res));

export default router;
```

#### 6.2 Conversation Routes
```typescript
// src/modules/chat/conversation.routes.ts
import { Router } from 'express';
import { authMiddleware, AuthRequest } from '../../shared/middleware/auth.middleware';
import { ConversationService } from './conversation.service';

const router = Router();
const conversationService = new ConversationService();

// Proteger todas las rutas
router.use(authMiddleware);

router.get('/', async (req: AuthRequest, res) => {
  try {
    const conversations = await conversationService.getUserConversations(req.userId!);
    res.json(conversations);
  } catch (error) {
    res.status(500).json({ error: 'Failed to load conversations' });
  }
});

router.post('/direct', async (req: AuthRequest, res) => {
  try {
    const { targetUserId } = req.body;
    const conversation = await conversationService.createDirectConversation(
      req.userId!,
      targetUserId
    );
    res.json(conversation);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create conversation' });
  }
});

router.post('/group', async (req: AuthRequest, res) => {
  try {
    const { name, participants } = req.body;
    const conversation = await conversationService.createGroupConversation(
      name,
      [req.userId!, ...participants]
    );
    res.json(conversation);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create group' });
  }
});

router.get('/:id/messages', async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;
    const before = req.query.before ? new Date(req.query.before as string) : undefined;
    
    const messages = await conversationService.getMessages(id, limit, before);
    res.json(messages);
  } catch (error) {
    res.status(500).json({ error: 'Failed to load messages' });
  }
});

export default router;
```

### 7. Media Upload

```typescript
// src/modules/media/media.routes.ts
import { Router } from 'express';
import multer from 'multer';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { authMiddleware } from '../../shared/middleware/auth.middleware';

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });
const s3Client = new S3Client({ region: process.env.AWS_REGION });

router.use(authMiddleware);

router.post('/upload', upload.single('file'), async (req, res) => {
  try {
    const file = req.file;
    
    if (!file) {
      return res.status(400).json({ error: 'No file provided' });
    }
    
    const key = `uploads/${crypto.randomUUID()}-${file.originalname}`;
    
    await s3Client.send(new PutObjectCommand({
      Bucket: process.env.S3_BUCKET,
      Key: key,
      Body: file.buffer,
      ContentType: file.mimetype
    }));
    
    const url = `https://${process.env.S3_BUCKET}.s3.amazonaws.com/${key}`;
    res.json({ url });
  } catch (error) {
    res.status(500).json({ error: 'Upload failed' });
  }
});

export default router;
```

### 8. Servicio de RabbitMQ

```typescript
// src/shared/services/rabbitmq.service.ts
import amqp, { Connection, Channel } from 'amqplib';

export class RabbitMQService {
  private connection: Connection | null = null;
  private channel: Channel | null = null;
  
  async connect() {
    try {
      this.connection = await amqp.connect(process.env.RABBITMQ_URL || 'amqp://localhost');
      this.channel = await this.connection.createChannel();
      console.log('Connected to RabbitMQ');
    } catch (error) {
      console.error('RabbitMQ connection error:', error);
      throw error;
    }
  }
  
  async publishMessage(queue: string, message: any) {
    if (!this.channel) {
      await this.connect();
    }
    
    await this.channel!.assertQueue(queue, { durable: true });
    this.channel!.sendToQueue(queue, Buffer.from(JSON.stringify(message)), {
      persistent: true
    });
  }
  
  async consumeMessages(queue: string, callback: (message: any) => void) {
    if (!this.channel) {
      await this.connect();
    }
    
    await this.channel!.assertQueue(queue, { durable: true });
    this.channel!.consume(queue, (msg) => {
      if (msg) {
        const content = JSON.parse(msg.content.toString());
        callback(content);
        this.channel!.ack(msg);
      }
    });
  }
  
  async close() {
    await this.channel?.close();
    await this.connection?.close();
  }
}
```

---

## Servidor Principal con Express

### Archivo principal con HTTP y WebSocket
```typescript
// src/main.ts
import express from 'express';
import { createServer } from 'http';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import { ChatGateway } from './gateway/chat.gateway';
import authRoutes from './modules/auth/auth.routes';
import conversationRoutes from './modules/chat/conversation.routes';
import mediaRoutes from './modules/media/media.routes';
import { RabbitMQService } from './shared/services/rabbitmq.service';

const app = express();
const server = createServer(app);

// Middleware
app.use(cors());
app.use(helmet());
app.use(compression());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/conversations', conversationRoutes);
app.use('/api/media', mediaRoutes);

app.get('/', (req, res) => {
  res.json({ message: 'Chat API Server' });
});

// Inicializar WebSocket
const chatGateway = new ChatGateway(server);

// Inicializar RabbitMQ
const rabbitMQService = new RabbitMQService();
rabbitMQService.connect().then(() => {
  // Consumir mensajes de la cola
  rabbitMQService.consumeMessages('messages', async (message) => {
    console.log('Processing message:', message);
    // Guardar mensaje en base de datos
    // Implementar lógica de procesamiento
  });
});

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});

// Manejo de señales de terminación
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, closing server...');
  await rabbitMQService.close();
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});
```

### package.json para Backend
```json
{
  "name": "chat-backend",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "bun --watch src/main.ts",
    "start": "bun src/main.ts",
    "test": "bun test"
  },
  "dependencies": {
    "express": "latest",
    "@types/express": "latest",
    "socket.io": "latest",
    "mongoose": "latest",
    "ioredis": "latest",
    "amqplib": "latest",
    "@types/amqplib": "latest",
    "jsonwebtoken": "latest",
    "@types/jsonwebtoken": "latest",
    "passport": "latest",
    "passport-jwt": "latest",
    "@types/passport-jwt": "latest",
    "multer": "latest",
    "@types/multer": "latest",
    "@aws-sdk/client-s3": "latest",
    "@prisma/client": "latest",
    "cors": "latest",
    "@types/cors": "latest",
    "helmet": "latest",
    "compression": "latest",
    "@types/compression": "latest",
    "dotenv": "latest"
  },
  "devDependencies": {
    "bun-types": "latest",
    "@types/node": "latest",
    "prisma": "latest"
  }
}
```

---

## Frontend - Plan Detallado

### 1. Setup Inicial del Proyecto

#### Estructura de Directorios
```
frontend/
├── src/
│   ├── app/              # Next.js app directory
│   │   ├── (auth)/       # Auth routes
│   │   ├── (chat)/       # Chat routes
│   │   └── layout.tsx
│   ├── components/
│   │   ├── chat/         # Chat components
│   │   ├── auth/         # Auth components
│   │   └── layout/       # Layout components
│   ├── hooks/
│   │   ├── useSocket.ts
│   │   ├── useChat.ts
│   │   └── useAuth.ts
│   ├── lib/
│   │   ├── socket.ts     # Socket.io setup
│   │   ├── api.ts        # TanStack Query setup
│   │   └── utils.ts
│   ├── store/
│   │   ├── authStore.ts
│   │   └── chatStore.ts
│   ├── types/
│   │   └── index.ts
│   └── styles/
│       ├── globals.scss
│       └── components/   # Component styles
├── public/
├── next.config.js
├── package.json
└── tsconfig.json
```

#### Comandos de Inicio
```bash
# Crear proyecto Next.js
bunx create-next-app@latest frontend --typescript --app

cd frontend

# Instalar dependencias
bun add socket.io-client zustand
bun add @tanstack/react-query
bun add react-hook-form zod @hookform/resolvers
bun add date-fns
bun add sass

# Instalar dependencias de desarrollo
bun add -d @types/node
```

### 2. Configuración de Socket.io

```typescript
// src/lib/socket.ts
import { io, Socket } from 'socket.io-client';

class SocketService {
  private socket: Socket | null = null;
  
  connect(token: string) {
    this.socket = io(process.env.NEXT_PUBLIC_WS_URL!, {
      auth: { token }
    });
    
    this.socket.on('connect', () => {
      console.log('Connected to WebSocket');
    });
    
    this.socket.on('disconnect', () => {
      console.log('Disconnected from WebSocket');
    });
    
    return this.socket;
  }
  
  disconnect() {
    this.socket?.disconnect();
    this.socket = null;
  }
  
  emit(event: string, data: any) {
    this.socket?.emit(event, data);
  }
  
  on(event: string, callback: (...args: any[]) => void) {
    this.socket?.on(event, callback);
  }
  
  off(event: string) {
    this.socket?.off(event);
  }
  
  getSocket() {
    return this.socket;
  }
}

export const socketService = new SocketService();
```

### 3. Configuración de TanStack Query

```typescript
// src/lib/api.ts
import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000, // 1 minuto
      refetchOnWindowFocus: false,
    },
  },
});

// API client helper
const API_URL = process.env.NEXT_PUBLIC_API_URL;

export const apiClient = {
  get: async (endpoint: string, token?: string) => {
    const response = await fetch(`${API_URL}${endpoint}`, {
      headers: {
        'Authorization': token ? `Bearer ${token}` : '',
        'Content-Type': 'application/json',
      },
    });
    if (!response.ok) throw new Error('Request failed');
    return response.json();
  },
  
  post: async (endpoint: string, data: any, token?: string) => {
    const response = await fetch(`${API_URL}${endpoint}`, {
      method: 'POST',
      headers: {
        'Authorization': token ? `Bearer ${token}` : '',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Request failed');
    return response.json();
  },
};
```

### 4. Store con Zustand

#### 4.1 Auth Store
```typescript
// src/store/authStore.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface User {
  id: string;
  username: string;
  email: string;
  avatar?: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (token: string, user: User) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      login: (token, user) => set({ token, user, isAuthenticated: true }),
      logout: () => set({ token: null, user: null, isAuthenticated: false })
    }),
    {
      name: 'auth-storage'
    }
  )
);
```

#### 4.2 Chat Store
```typescript
// src/store/chatStore.ts
import { create } from 'zustand';

interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  type: 'text' | 'image' | 'video';
  timestamp: Date;
  status: 'sent' | 'delivered' | 'read';
}

interface Conversation {
  id: string;
  type: 'direct' | 'group';
  participants: string[];
  name?: string;
  lastMessage?: Message;
  unreadCount: number;
}

interface ChatState {
  conversations: Conversation[];
  messages: Record<string, Message[]>;
  activeConversationId: string | null;
  typingUsers: Record<string, string[]>;
  
  setConversations: (conversations: Conversation[]) => void;
  addConversation: (conversation: Conversation) => void;
  setMessages: (conversationId: string, messages: Message[]) => void;
  addMessage: (message: Message) => void;
  setActiveConversation: (id: string) => void;
  setTyping: (conversationId: string, userId: string, isTyping: boolean) => void;
}

export const useChatStore = create<ChatState>((set) => ({
  conversations: [],
  messages: {},
  activeConversationId: null,
  typingUsers: {},
  
  setConversations: (conversations) => set({ conversations }),
  
  addConversation: (conversation) =>
    set((state) => ({
      conversations: [conversation, ...state.conversations]
    })),
  
  setMessages: (conversationId, messages) =>
    set((state) => ({
      messages: { ...state.messages, [conversationId]: messages }
    })),
  
  addMessage: (message) =>
    set((state) => ({
      messages: {
        ...state.messages,
        [message.conversationId]: [
          ...(state.messages[message.conversationId] || []),
          message
        ]
      }
    })),
  
  setActiveConversation: (id) => set({ activeConversationId: id }),
  
  setTyping: (conversationId, userId, isTyping) =>
    set((state) => {
      const current = state.typingUsers[conversationId] || [];
      const updated = isTyping
        ? [...current, userId]
        : current.filter((id) => id !== userId);
      
      return {
        typingUsers: { ...state.typingUsers, [conversationId]: updated }
      };
    })
}));
```

### 5. Custom Hooks

#### 5.1 useSocket Hook
```typescript
// src/hooks/useSocket.ts
import { useEffect } from 'react';
import { socketService } from '@/lib/socket';
import { useAuthStore } from '@/store/authStore';
import { useChatStore } from '@/store/chatStore';

export const useSocket = () => {
  const token = useAuthStore((state) => state.token);
  const addMessage = useChatStore((state) => state.addMessage);
  const setTyping = useChatStore((state) => state.setTyping);
  
  useEffect(() => {
    if (!token) return;
    
    const socket = socketService.connect(token);
    
    // Escuchar mensajes nuevos
    socket.on('new_message', (message) => {
      addMessage(message);
    });
    
    // Escuchar typing indicators
    socket.on('user_typing', ({ conversationId, userId, isTyping }) => {
      setTyping(conversationId, userId, isTyping);
    });
    
    // Cleanup
    return () => {
      socketService.disconnect();
    };
  }, [token, addMessage, setTyping]);
  
  return socketService;
};
```

#### 5.2 useChat Hook
```typescript
// src/hooks/useChat.ts
import { useCallback } from 'react';
import { socketService } from '@/lib/socket';
import { useChatStore } from '@/store/chatStore';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';

export const useChat = () => {
  const token = useAuthStore((state) => state.token);
  const {
    activeConversationId,
    messages,
    addMessage,
    setMessages
  } = useChatStore();
  
  const sendMessage = useCallback((content: string, type = 'text') => {
    if (!activeConversationId) return;
    
    const tempMessage = {
      id: `temp-${Date.now()}`,
      conversationId: activeConversationId,
      content,
      type,
      timestamp: new Date(),
      status: 'sent' as const,
      senderId: 'me' // Obtener del auth store
    };
    
    addMessage(tempMessage);
    
    socketService.emit('send_message', {
      conversationId: activeConversationId,
      content,
      type
    });
  }, [activeConversationId, addMessage]);
  
  const { data: messagesData } = useQuery({
    queryKey: ['messages', activeConversationId],
    queryFn: () => apiClient.get(`/api/conversations/${activeConversationId}/messages`, token!),
    enabled: !!activeConversationId && !!token,
  });
  
  const sendTyping = useCallback((isTyping: boolean) => {
    if (!activeConversationId) return;
    
    socketService.emit('typing', {
      conversationId: activeConversationId,
      isTyping
    });
  }, [activeConversationId]);
  
  return {
    messages: activeConversationId ? messages[activeConversationId] || [] : [],
    sendMessage,
    sendTyping
  };
};
```

### 6. Componentes UI con Sass

#### 6.1 ChatList Component
```typescript
// src/components/chat/ChatList.tsx
'use client';

import { useEffect } from 'react';
import { useChatStore } from '@/store/chatStore';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { formatDistanceToNow } from 'date-fns';
import styles from '@/styles/components/ChatList.module.scss';

export const ChatList = () => {
  const token = useAuthStore((state) => state.token);
  const { conversations, setConversations, setActiveConversation } = useChatStore();
  
  const { data } = useQuery({
    queryKey: ['conversations'],
    queryFn: () => apiClient.get('/api/conversations', token!),
    enabled: !!token,
  });
  
  useEffect(() => {
    if (data) {
      setConversations(data);
    }
  }, [data, setConversations]);
  
  return (
    <div className={styles.chatList}>
      <div className={styles.header}>
        <h2>Chats</h2>
      </div>
      
      <div className={styles.conversationList}>
        {conversations.map((conv) => (
          <div
            key={conv.id}
            onClick={() => setActiveConversation(conv.id)}
            className={styles.conversationItem}
          >
            <div className={styles.avatar}>
              {conv.avatar ? (
                <img src={conv.avatar} alt={conv.name} />
              ) : (
                <div className={styles.avatarFallback}>
                  {conv.name?.[0] || 'C'}
                </div>
              )}
            </div>
            
            <div className={styles.conversationInfo}>
              <div className={styles.conversationHeader}>
                <p className={styles.conversationName}>{conv.name}</p>
                {conv.lastMessage && (
                  <span className={styles.timestamp}>
                    {formatDistanceToNow(new Date(conv.lastMessage.timestamp))}
                  </span>
                )}
              </div>
              
              {conv.lastMessage && (
                <p className={styles.lastMessage}>
                  {conv.lastMessage.content}
                </p>
              )}
              
              {conv.unreadCount > 0 && (
                <span className={styles.unreadBadge}>
                  {conv.unreadCount}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
```

```scss
// src/styles/components/ChatList.module.scss
.chatList {
  width: 320px;
  border-right: 1px solid #e5e7eb;
  display: flex;
  flex-direction: column;
  height: 100%;

  .header {
    padding: 1rem;
    border-bottom: 1px solid #e5e7eb;

    h2 {
      font-size: 1.25rem;
      font-weight: 600;
      margin: 0;
    }
  }

  .conversationList {
    flex: 1;
    overflow-y: auto;
  }

  .conversationItem {
    display: flex;
    padding: 1rem;
    cursor: pointer;
    border-bottom: 1px solid #f3f4f6;
    transition: background-color 0.2s;

    &:hover {
      background-color: #f9fafb;
    }

    .avatar {
      width: 48px;
      height: 48px;
      border-radius: 50%;
      overflow: hidden;
      margin-right: 0.75rem;

      img {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }

      .avatarFallback {
        width: 100%;
        height: 100%;
        display: flex;
        align-items: center;
        justify-content: center;
        background-color: #3b82f6;
        color: white;
        font-weight: 600;
      }
    }

    .conversationInfo {
      flex: 1;
      min-width: 0;

      .conversationHeader {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 0.25rem;

        .conversationName {
          font-weight: 500;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          margin: 0;
        }

        .timestamp {
          font-size: 0.75rem;
          color: #6b7280;
          white-space: nowrap;
        }
      }

      .lastMessage {
        font-size: 0.875rem;
        color: #6b7280;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        margin: 0;
      }

      .unreadBadge {
        display: inline-block;
        margin-top: 0.25rem;
        padding: 0.125rem 0.5rem;
        font-size: 0.75rem;
        background-color: #3b82f6;
        color: white;
        border-radius: 9999px;
      }
    }
  }
}
```

#### 6.2 MessageList Component
```typescript
// src/components/chat/MessageList.tsx
'use client';

import { useEffect, useRef } from 'react';
import { useChat } from '@/hooks/useChat';
import { format } from 'date-fns';
import { useAuthStore } from '@/store/authStore';
import styles from '@/styles/components/MessageList.module.scss';

export const MessageList = () => {
  const { messages } = useChat();
  const user = useAuthStore((state) => state.user);
  const scrollRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);
  
  return (
    <div className={styles.messageList}>
      {messages.map((message) => {
        const isOwn = message.senderId === user?.id;
        
        return (
          <div
            key={message.id}
            className={`${styles.messageWrapper} ${isOwn ? styles.own : ''}`}
          >
            {!isOwn && (
              <div className={styles.avatar}>
                <div className={styles.avatarFallback}>U</div>
              </div>
            )}
            
            <div className={styles.messageContent}>
              <div className={`${styles.messageBubble} ${isOwn ? styles.ownBubble : ''}`}>
                {message.type === 'text' && <p>{message.content}</p>}
                {message.type === 'image' && (
                  <img src={message.content} alt="Sent image" />
                )}
              </div>
              
              <span className={styles.messageTime}>
                {format(new Date(message.timestamp), 'HH:mm')}
                {isOwn && message.status === 'read' && ' ✓✓'}
              </span>
            </div>
          </div>
        );
      })}
      <div ref={scrollRef} />
    </div>
  );
};
```

```scss
// src/styles/components/MessageList.module.scss
.messageList {
  flex: 1;
  padding: 1rem;
  overflow-y: auto;

  .messageWrapper {
    display: flex;
    gap: 0.75rem;
    margin-bottom: 1rem;

    &.own {
      flex-direction: row-reverse;
    }

    .avatar {
      width: 32px;
      height: 32px;
      border-radius: 50%;
      overflow: hidden;

      .avatarFallback {
        width: 100%;
        height: 100%;
        display: flex;
        align-items: center;
        justify-content: center;
        background-color: #9ca3af;
        color: white;
        font-size: 0.875rem;
      }
    }

    .messageContent {
      display: flex;
      flex-direction: column;
      max-width: 70%;

      .messageBubble {
        padding: 0.75rem 1rem;
        border-radius: 0.75rem;
        background-color: #f3f4f6;
        color: #111827;

        &.ownBubble {
          background-color: #3b82f6;
          color: white;
        }

        p {
          margin: 0;
        }

        img {
          max-width: 384px;
          border-radius: 0.5rem;
        }
      }

      .messageTime {
        font-size: 0.75rem;
        color: #6b7280;
        margin-top: 0.25rem;
        align-self: flex-end;
      }
    }

    &.own .messageContent {
      align-items: flex-end;

      .messageTime {
        align-self: flex-start;
      }
    }
  }
}
```

#### 6.3 MessageInput Component
```typescript
// src/components/chat/MessageInput.tsx
'use client';

import { useState } from 'react';
import { useChat } from '@/hooks/useChat';
import styles from '@/styles/components/MessageInput.module.scss';

export const MessageInput = () => {
  const [message, setMessage] = useState('');
  const { sendMessage, sendTyping } = useChat();
  
  const handleSend = () => {
    if (!message.trim()) return;
    
    sendMessage(message);
    setMessage('');
  };
  
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };
  
  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMessage(e.target.value);
    sendTyping(e.target.value.length > 0);
  };
  
  return (
    <div className={styles.messageInput}>
      <button className={styles.attachButton}>
        📎
      </button>
      
      <textarea
        value={message}
        onChange={handleChange}
        onKeyPress={handleKeyPress}
        placeholder="Escribe un mensaje..."
        className={styles.textarea}
        rows={1}
      />
      
      <button onClick={handleSend} className={styles.sendButton}>
        ➤
      </button>
    </div>
  );
};
```

```scss
// src/styles/components/MessageInput.module.scss
.messageInput {
  padding: 1rem;
  border-top: 1px solid #e5e7eb;
  display: flex;
  gap: 0.5rem;
  align-items: flex-end;

  .attachButton,
  .sendButton {
    padding: 0.5rem;
    background-color: #f3f4f6;
    border: 1px solid #d1d5db;
    border-radius: 0.5rem;
    cursor: pointer;
    transition: background-color 0.2s;
    font-size: 1.25rem;
    
    &:hover {
      background-color: #e5e7eb;
    }

    &:active {
      background-color: #d1d5db;
    }
  }

  .sendButton {
    background-color: #3b82f6;
    color: white;
    border-color: #3b82f6;

    &:hover {
      background-color: #2563eb;
    }

    &:active {
      background-color: #1d4ed8;
    }
  }

  .textarea {
    flex: 1;
    padding: 0.5rem 0.75rem;
    border: 1px solid #d1d5db;
    border-radius: 0.5rem;
    resize: none;
    font-family: inherit;
    font-size: 1rem;
    line-height: 1.5;

    &:focus {
      outline: none;
      border-color: #3b82f6;
      box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
    }

    &::placeholder {
      color: #9ca3af;
    }
  }
}
```

### 7. Páginas Principales

#### 7.1 Chat Page
```typescript
// src/app/(chat)/chat/page.tsx
'use client';

import { useSocket } from '@/hooks/useSocket';
import { ChatList } from '@/components/chat/ChatList';
import { MessageList } from '@/components/chat/MessageList';
import { MessageInput } from '@/components/chat/MessageInput';
import { useChatStore } from '@/store/chatStore';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '@/lib/api';
import styles from '@/styles/pages/ChatPage.module.scss';

export default function ChatPage() {
  useSocket(); // Inicializar WebSocket
  
  const activeConversationId = useChatStore((state) => state.activeConversationId);
  
  return (
    <QueryClientProvider client={queryClient}>
      <div className={styles.chatPage}>
        <ChatList />
        
        {activeConversationId ? (
          <div className={styles.chatArea}>
            <div className={styles.chatHeader}>
              <h3>Conversation Name</h3>
            </div>
            
            <MessageList />
            <MessageInput />
          </div>
        ) : (
          <div className={styles.emptyState}>
            Selecciona una conversación para comenzar
          </div>
        )}
      </div>
    </QueryClientProvider>
  );
}
```

```scss
// src/styles/pages/ChatPage.module.scss
.chatPage {
  display: flex;
  height: 100vh;

  .chatArea {
    flex: 1;
    display: flex;
    flex-direction: column;

    .chatHeader {
      padding: 1rem;
      border-bottom: 1px solid #e5e7eb;

      h3 {
        margin: 0;
        font-weight: 600;
      }
    }
  }

  .emptyState {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #6b7280;
    font-size: 1.125rem;
  }
}
```

### 8. Estilos Globales

```scss
// src/styles/globals.scss
* {
  box-sizing: border-box;
  padding: 0;
  margin: 0;
}

html,
body {
  max-width: 100vw;
  overflow-x: hidden;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen',
    'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue',
    sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

a {
  color: inherit;
  text-decoration: none;
}

button {
  font-family: inherit;
}

/* Scrollbar styles */
::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

::-webkit-scrollbar-track {
  background: #f1f1f1;
}

::-webkit-scrollbar-thumb {
  background: #888;
  border-radius: 4px;
}

::-webkit-scrollbar-thumb:hover {
  background: #555;
}
```

---

## DevOps y Deployment

### Docker Setup

#### Backend Dockerfile
```dockerfile
FROM oven/bun:1 AS base

WORKDIR /app

# Instalar dependencias
COPY package.json bun.lockb ./
RUN bun install --frozen-lockfile --production

# Copiar código fuente
COPY . .

EXPOSE 3000

# Ejecutar con Bun
CMD ["bun", "run", "src/main.ts"]
```

#### Frontend Dockerfile
```dockerfile
FROM oven/bun:1 AS base

WORKDIR /app

# Instalar dependencias
COPY package.json bun.lockb ./
RUN bun install --frozen-lockfile

# Copiar código fuente
COPY . .

# Build
RUN bun run build

EXPOSE 3000

CMD ["bun", "run", "start"]
```

#### Docker Compose
```yaml
version: '3.8'

services:
  postgres:
    image: postgres:15
    environment:
      POSTGRES_DB: chatapp
      POSTGRES_USER: user
      POSTGRES_PASSWORD: password
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
    networks:
      - chat-network
  
  mongodb:
    image: mongo:7
    ports:
      - "27017:27017"
    volumes:
      - mongo_data:/data/db
    networks:
      - chat-network
  
  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    networks:
      - chat-network
  
  rabbitmq:
    image: rabbitmq:3-management-alpine
    ports:
      - "5672:5672"
      - "15672:15672"
    environment:
      RABBITMQ_DEFAULT_USER: admin
      RABBITMQ_DEFAULT_PASS: password
    volumes:
      - rabbitmq_data:/var/lib/rabbitmq
    networks:
      - chat-network
  
  backend:
    build: ./backend
    ports:
      - "3000:3000"
    environment:
      DATABASE_URL: postgresql://user:password@postgres:5432/chatapp
      MONGODB_URL: mongodb://mongodb:27017/chatapp
      REDIS_URL: redis://redis:6379
      RABBITMQ_URL: amqp://admin:password@rabbitmq:5672
      JWT_SECRET: your-secret-key
      CLIENT_URL: http://localhost:3001
    depends_on:
      - postgres
      - mongodb
      - redis
      - rabbitmq
    networks:
      - chat-network
  
  frontend:
    build: ./frontend
    ports:
      - "3001:3000"
    environment:
      NEXT_PUBLIC_API_URL: http://localhost:3000
      NEXT_PUBLIC_WS_URL: ws://localhost:3000
    depends_on:
      - backend
    networks:
      - chat-network

volumes:
  postgres_data:
  mongo_data:
  rabbitmq_data:

networks:
  chat-network:
    driver: bridge
```

### Comandos Docker

```bash
# Construir y levantar todos los servicios
docker-compose up -d

# Ver logs
docker-compose logs -f backend
docker-compose logs -f frontend

# Detener servicios
docker-compose down

# Reconstruir servicios
docker-compose up -d --build

# Ver estado de servicios
docker-compose ps
```

---

## Testing

### Backend Tests
```typescript
// tests/message.test.ts
import { describe, it, expect } from 'bun:test';
import { MessageService } from '../src/modules/messages/message.service';

describe('MessageService', () => {
  it('should create a message', async () => {
    const service = new MessageService();
    const message = await service.createMessage({
      conversationId: '123',
      senderId: 'user1',
      content: 'Test message'
    });
    
    expect(message).toBeDefined();
    expect(message.content).toBe('Test message');
  });
});
```

### Frontend Tests
```typescript
// src/components/chat/__tests__/MessageInput.test.tsx
import { render, fireEvent } from '@testing-library/react';
import { MessageInput } from '../MessageInput';

describe('MessageInput', () => {
  it('should send message on button click', () => {
    const { getByRole, getByPlaceholderText } = render(<MessageInput />);
    
    const input = getByPlaceholderText('Escribe un mensaje...');
    const button = getByRole('button');
    
    fireEvent.change(input, { target: { value: 'Hello' } });
    fireEvent.click(button);
    
    expect(input).toHaveValue('');
  });
});
```

---

## Timeline Estimado

### Fase 1: Setup (Semana 1-2)
- Día 1-2: Configuración de proyectos
- Día 3-4: Setup de bases de datos
- Día 5-7: Sistema de autenticación
- Día 8-10: APIs REST básicas

### Fase 2: Mensajería Básica (Semana 3-4)
- Día 11-13: WebSocket server
- Día 14-16: Mensajería 1-a-1
- Día 17-19: UI de chat básico
- Día 20: Testing e integración

### Fase 3: Características Intermedias (Semana 5-6)
- Día 21-24: Chats grupales
- Día 25-27: Estado de presencia
- Día 28-30: Typing indicators y confirmaciones

### Fase 4: Multimedia (Semana 7-8)
- Día 31-35: Sistema de upload
- Día 36-38: Notificaciones push
- Día 39-40: Búsqueda de mensajes

### Fase 5: Producción (Semana 9-10)
- Día 41-43: Optimización de performance
- Día 44-46: Testing completo
- Día 47-48: Deployment
- Día 49-50: Monitoring y ajustes

**Total: 10 semanas para MVP completo**

---

## Próximos Pasos

1. **Iniciar con Fase 1**: Setup del proyecto backend
2. **Configurar bases de datos**: PostgreSQL, MongoDB, Redis
3. **Implementar autenticación**: JWT + Passport
4. **Desarrollar WebSocket**: Socket.io server
5. **Crear UI básico**: Next.js con Tailwind
6. **Integrar frontend-backend**: APIs y WebSocket
7. **Testing**: Unit y E2E tests
8. **Deploy**: Docker + Cloud provider

¡Comencemos a construir!
