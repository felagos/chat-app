# Chat App Backend

Backend implementation for the Chat Application with Express.js, Socket.io, and RabbitMQ.

## Prerequisites

- Node.js 20+
- PostgreSQL 16+
- MongoDB 7+
- Redis 7+
- RabbitMQ 3.12+

## Quick Start

### 1. Setup Environment

```bash
cd backend
cp .env.example .env
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Generate Prisma Client

```bash
npm run prisma:generate
```

### 4. Run Database Migrations

```bash
npm run prisma:migrate
```

### 5. Start Development Server

```bash
npm run dev
```

The server will start on `http://localhost:3000`

## Docker Compose

To run the entire stack with Docker Compose:

```bash
docker-compose up
```

This will start:
- **Backend**: http://localhost:3000
- **PostgreSQL**: localhost:5432
- **MongoDB**: localhost:27017
- **Redis**: localhost:6379
- **RabbitMQ**: localhost:5672 (AMQP) / http://localhost:15672 (Management UI)

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user

### Chat
- `GET /api/chat` - Get all conversations
- `POST /api/chat` - Create new conversation
- `GET /api/chat/:id` - Get conversation details
- `GET /api/chat/:id/messages` - Get conversation messages

## WebSocket Events

### Client → Server
- `message:send` - Send a new message
- `typing:start` - User started typing
- `typing:stop` - User stopped typing
- `conversation:join` - Join conversation room
- `conversation:leave` - Leave conversation room

### Server → Client
- `message:received` - New message received
- `user:typing` - User is typing
- `user:stopped-typing` - User stopped typing
- `user:joined` - User joined conversation
- `user:left` - User left conversation
- `user:online` - User is online
- `user:offline` - User is offline

## Project Structure

```
backend/
├── src/
│   ├── config/          # Configuration files
│   ├── database/        # Database models
│   ├── gateway/         # Socket.io setup
│   ├── modules/
│   │   ├── auth/        # Authentication module
│   │   ├── chat/        # Chat module
│   │   ├── messages/    # Messages module
│   │   └── media/       # Media module
│   ├── shared/
│   │   ├── middleware/  # Express middleware
│   │   └── services/    # Shared services (RabbitMQ, etc)
│   └── server.ts        # Main server file
├── prisma/
│   └── schema.prisma    # Database schema
└── package.json
```

## Development

### Scripts
- `npm run dev` - Run development server with hot reload
- `npm run build` - Build for production
- `npm start` - Run production server
- `npm run prisma:generate` - Generate Prisma Client
- `npm run prisma:migrate` - Run database migrations
- `npm run prisma:studio` - Open Prisma Studio

## Environment Variables

See `.env.example` for all available variables.

Key variables:
- `PORT` - Server port (default: 3000)
- `DATABASE_URL` - PostgreSQL connection string
- `MONGODB_URL` - MongoDB connection string
- `REDIS_URL` - Redis connection string
- `RABBITMQ_URL` - RabbitMQ connection string
- `JWT_SECRET` - JWT signing secret
- `JWT_EXPIRATION` - JWT token expiration (default: 7d)
- `SOCKET_IO_CORS` - CORS origin for Socket.io

## Authentication

The backend uses JWT (JSON Web Tokens) for authentication:

1. Users register or login via `/api/auth` endpoints
2. Server returns a JWT token
3. Client includes token in `Authorization: Bearer <token>` header for authenticated requests
4. Client includes token in Socket.io connection `auth.token` handshake

## Message Queue

RabbitMQ is used for asynchronous message processing:

- **Exchange**: `chat` (topic exchange)
- **Queues**:
  - `messages.queue` - New message processing
  - `notifications.queue` - User notifications
  - `media.queue` - Media upload processing

## Database

### PostgreSQL
Stores relational data using Prisma ORM:
- Users
- Conversations
- Messages (metadata)
- Media (metadata)

### MongoDB
Stores document data:
- Message content (optional large text)
- User profiles (optional extended data)

### Redis
Caching layer:
- User sessions
- Online status
- Message cache

## Real-time Communication

Socket.io is used for real-time features:
- Message delivery notifications
- Typing indicators
- User presence (online/offline)
- Conversation updates

## Error Handling

The backend implements comprehensive error handling:
- Input validation
- Authentication errors
- Authorization checks
- Database errors
- RabbitMQ connection errors

## License

ISC
