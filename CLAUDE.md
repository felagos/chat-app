# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Real-time chat application split into three independently deployed services, each with its own `package.json`, dependencies, and Dockerfile — there is no root workspace/monorepo tooling tying them together:

- **`backend/`** — Express + Socket.io API and WebSocket gateway (port 3000). Auth, conversations, users, real-time messaging.
- **`message-queue-service/`** — Express service (port 3001) whose only job is consuming RabbitMQ queues and persisting messages to Postgres.
- **`frontend/`** — React 19 + Vite + Ant Design SPA (dev port 5173, served via nginx on port 80 in Docker).

All three run on Bun (`bun run dev` / `bun install`), though the code is plain TypeScript/Express and would also run under Node.

## Common Commands

Most day-to-day commands are wrapped in the root `Makefile` (run `make help` for the full list):

```bash
make install         # bun install in all three services
make dev-backend      # cd backend && bun run dev
make dev-frontend     # cd frontend && bun run dev
make dev-mqs          # cd message-queue-service && bun run dev

make up               # docker-compose up -d (full stack incl. Postgres/Mongo/Redis/RabbitMQ)
make down / restart / rebuild
make logs / logs-backend / logs-mqs
make ps

make prisma-migrate   # cd backend && bun run prisma:migrate
make prisma-studio    # cd backend && bun run prisma:studio
make clean            # docker-compose down -v
```

Per-service commands (when not using the Makefile):

```bash
# backend
cd backend && bun run dev              # bun --watch src/server.ts
cd backend && bun run prisma:generate
cd backend && bun run prisma:migrate

# message-queue-service
cd message-queue-service && bun run dev
cd message-queue-service && bun run lint
cd message-queue-service && bunx prisma migrate dev   # no prisma:* script defined, call prisma directly

# frontend
cd frontend && bun run dev
cd frontend && bun run type-check      # tsc --noEmit
cd frontend && bun run lint            # eslint .
cd frontend && bun run build           # tsc -b && vite build
```

There is no test suite in this repo (no `*.test.ts`/`*.spec.ts` outside `node_modules`) — don't assume one exists when asked to "run the tests".

For a scaled topology (3x backend + 3x message-queue-service behind nginx load balancers), use `docker-compose -f docker-compose.scale.yml up`. `nginx-backend.conf` / `nginx-mqs.conf` are the corresponding LB configs.

## Architecture

### Message flow is queue-mediated, not a direct DB write

The backend does **not** write chat messages to the database itself. When a client emits `message:send` over Socket.io (`backend/src/gateway/socket.ts`):

1. The backend immediately re-emits the message to other participants in the conversation room (`message:received`) — this is optimistic/unpersisted.
2. The backend publishes the message to the RabbitMQ topic exchange `chat` with routing key `message.new` (`backend/src/shared/services/rabbitmq.ts`).
3. `message-queue-service` consumes `messages.queue` (bound to `chat`/`message.new`), persists the message via its own Prisma client, then publishes `message.processed` to `notifications.queue` (`message-queue-service/src/services/messageConsumer.ts`).

Implication: clients can see a message over the socket before it exists in Postgres. If you're debugging "message not found" issues, check whether the queue consumer actually processed it.

### Two independent Prisma schemas, one database

`backend/prisma/schema.prisma` and `message-queue-service/prisma/schema.prisma` define the **same** models (`User`, `Conversation`, `Message`, `Media`) against the same Postgres database, but are separate schema files with separate generated clients:
- backend uses the classic `prisma-client-js` generator.
- message-queue-service uses the newer `prisma-client` generator, output to `src/generated/prisma`, with `@prisma/adapter-pg`.

**When changing the data model, update both schema files and regenerate both clients** — there is no shared schema package.

### WebSocket event contract is duplicated, not shared

The `WebSocketEvent` const object and payload types are defined independently in `backend/src/shared/types/websocket.ts` and `frontend/src/types/websocket.ts`. Keep both in sync by hand when adding/renaming events — there's no shared npm package between frontend and backend.

Socket auth (`backend/src/gateway/socket.ts`) trusts `socket.handshake.auth.token` / `auth.userId` sent by the client without verifying the JWT signature server-side — it only checks that both fields are present. REST endpoints, by contrast, do verify JWTs properly via `shared/middleware/auth.ts`.

### MongoDB and Redis are vestigial

`docker-compose.yml`, `docker-compose.scale.yml`, and `backend/.env.example` all reference MongoDB and Redis, and `documentation/README-DESIGN-CONCEPTS.md` / `README-IMPLEMENTATION-PLAN.md` describe a design using both — but no current backend or message-queue-service code actually connects to either (no `mongoose`/`redis`/`ioredis` usage anywhere in `src/`). Presence/session tracking (`backend/src/shared/services/pushNotification.ts`) uses in-process `Map`s as a stand-in for what was meant to be Redis, and push/email/SMS notifications there are fully mocked (console.log only, commented-out Twilio/Nodemailer code). Don't assume Mongo/Redis integration exists; if adding it, it needs to be built from scratch.

### Backend module layout

Each domain lives under `backend/src/modules/<name>/` with `controller.ts` + `routes.ts` (+ `index.ts` re-export): `auth`, `chat` (conversations/messages), `users`. Shared cross-cutting code is under `backend/src/shared/` (`middleware/`, `services/`, `types/`) and `backend/src/config/` (Prisma client singleton, Socket.io instance accessor via `getIOInstance()`/`setIOInstance()` so controllers can emit socket events from REST handlers, e.g. `conversation:created` on `createConversation`).

### Frontend conventions (enforced by `.github/agents/frontend.agent.md`)

These are hard rules for this codebase, not suggestions:

- **Every component lives in its own folder**: `ComponentName/ComponentName.tsx` + `ComponentName.module.scss` + `index.ts` re-export. Named exports only, no default exports. Never a loose `.tsx` file outside its folder (a few legacy loose files like `frontend/src/components/chat/ChatList.tsx` predate this and coexist with the folder form — don't add more like them).
- **All server data fetching goes through TanStack Query** (`useQuery`/`useMutation`). Never `useEffect` + `fetch` for server state.
- **UI components come from Ant Design (antd v6)** — no Tailwind/MUI/custom CSS for things antd already provides.
- Component styles use `@use "@/styles/abstracts/_variables"` and `@use "@/styles/_mixins"`; no inline `style={{}}` for layout.
- Conditional classNames use `clsx`, not template literals.

State is split between Zustand stores (`frontend/src/store/authStore.ts` — persisted to localStorage; `chatStore.ts` — in-memory, holds conversations/messages/typing/online-status) and TanStack Query (server data like message history). Socket wiring lives in `frontend/src/hooks/useSocket.ts`, which pushes incoming socket events into the Zustand stores; `frontend/src/lib/socket.ts` is the typed Socket.io client wrapper. Routing is plain `react-router-dom` (see `frontend/src/main.tsx`), not Next.js, despite what the `documentation/` planning docs describe.

### Documentation caveat

`documentation/README-IMPLEMENTATION-PLAN.md` and `README-DESIGN-CONCEPTS.md` are early planning docs (Next.js, Mongoose, Passport, MongoDB+Redis+Postgres) written before implementation. The actual code diverged significantly (Vite/React Router instead of Next.js, no Mongoose/Passport, Mongo/Redis unused). Treat these docs as historical context, not a source of truth for current architecture.
