# Message Queue Service

Servicio independiente para gestionar RabbitMQ y procesamiento de mensajes.

## Features

- ✅ Conexión a RabbitMQ
- ✅ Publicación y consumo de mensajes
- ✅ API REST para comunicación con otros servicios
- ✅ WebHooks para procesamiento de mensajes

## Setup

```bash
bun install
cp .env.example .env
```

## Development

```bash
bun run dev
```

## Production

```bash
bun run build
bun start
```

## API Endpoints

### POST /api/messages/publish

Publica un mensaje en RabbitMQ.

**Body:**
```json
{
  "exchangeName": "chat",
  "routingKey": "message.new",
  "message": {
    "content": "Hello",
    "conversationId": "conv-123",
    "userId": "user-456"
  }
}
```

### GET /health

Verifica el estado del servicio.

## Environment Variables

- `PORT` - Puerto del servicio (default: 3001)
- `RABBITMQ_URL` - URL de conexión a RabbitMQ
- `NODE_ENV` - Ambiente (development/production)
