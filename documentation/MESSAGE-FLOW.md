# Message Flow: Send & Load

How a chat message travels through the system — REST endpoints, Socket.io events,
and the RabbitMQ queue that actually persists it. Source of truth: `backend/src/gateway/socket.ts`,
`backend/src/modules/chat/{controller,routes}.ts`, `backend/src/shared/services/rabbitmq.ts`,
`message-queue-service/src/services/{rabbitmq,messageConsumer}.ts`.

## 1. Sending a message (real-time path)

The key fact: **the backend never writes the message to Postgres itself.** It re-emits
optimistically over the socket, then hands the actual persistence off to a queue consumer
running in a completely different service.

```
 Browser A                    backend (Socket.io)                 RabbitMQ                message-queue-service
 (sender)                     gateway/socket.ts                   "chat" exchange          messageConsumer.ts
 ─────────                    ──────────────────                 ───────────────          ──────────────────
    │                                │                                  │                          │
    │  socket.emit                  │                                  │                          │
    │  "message:send"                │                                  │                          │
    │  { conversationId, content } ─▶│                                  │                          │
    │                                │                                  │                          │
    │                                │ 1. socket.to(`conversation:<id>`)│                          │
    │                                │    .emit("message:received", {   │                          │
    │                                │      id: "temp-<ts>",            │                          │
    │                                │      conversationId, userId,     │                          │
    │                                │      content, status:"sent",     │                          │
    │                                │      createdAt                   │                          │
    │                                │    })                            │                          │
    │                                │    ── optimistic, NOT in DB ──   │                          │
    │                                │                                  │                          │
    │                                │ 2. publishMessage(                │                          │
    │                                │      exchange: "chat",           │                          │
    │                                │      routingKey: "message.new",  │                          │
    │                                │      { conversationId, userId,   │                          │
    │                                │        content, timestamp })  ──▶│                          │
    │                                │                                  │                          │
    │                                │                                  │  binds "message.new" to  │
    │                                │                                  │  queue "messages.queue"  │
    │                                │                                  │ ────────────────────────▶│
    │                                │                                  │                          │
    │                                │                                  │                          │ 3. prisma.message.create({
    │                                │                                  │                          │      content, conversationId,
    │                                │                                  │                          │      userId })
    │                                │                                  │                          │    ── message now really
    │                                │                                  │                          │       exists in Postgres ──
    │                                │                                  │                          │
    │                                │                                  │◀── publishMessage(        │
    │                                │                                  │     "chat",               │
    │                                │                                  │     "message.processed",  │
    │                                │                                  │     { status:"processed", │
    │                                │                                  │       messageId,          │
    │                                │                                  │       timestamp })        │
    │                                │                                  │                          │
    │                                │                                  │ bound to                │
    │                                │                                  │ "notifications.queue"   │
    │                                │                                  │                          │
    │                                │                                  │◀─── notification         │
    │                                │                                  │     consumer logs it,    │
    │                                │                                  │     no handler registered │
    │                                │                                  │     today (no-op) ───────│

 Browser B (other participant)
 ──────────────────────────────
    │  already joined room `conversation:<id>` via "conversation:join"
    │◀── receives "message:received" from step 1 above (same as everyone else in the room)
```

Notes:
- Step 1 goes to `socket.to(room)`, **not** `io.to(room)` — the sender does not get an
  echoed copy back over the socket; the frontend renders its own optimistic local copy instead.
- The `id` field in the step-1 payload is a throwaway `temp-<timestamp>` string, not the real
  database ID (that only exists after step 3, and is never pushed back to clients).
- If step 3 ever fails (bad `conversationId`, DB down, etc.), the client has *already* rendered
  the message as sent in step 1 — there is no rollback event. "Message not found" bugs almost
  always mean step 3 silently failed; check `message-queue-service` logs, not the backend.
- `conversation:created` (a separate event, emitted by the REST `POST /api/chat` controller, not
  the socket gateway) is pushed to each participant's personal `user:<id>` room so new conversations
  appear live in every open tab without a page refresh.

## 2. Loading messages (REST path)

This is what actually reads persisted data back out of Postgres — used on initial page load,
opening a conversation, or paginating older history. All routes require a valid access-token
JWT (`Authorization: Bearer <token>`, `backend/src/shared/middleware/auth.ts`).

```
 Browser                              backend REST API                         Postgres
 ───────                              backend/src/modules/chat                 ────────
    │                                  routes.ts + controller.ts                   │
    │                                                                              │
    │  GET /api/chat            ────▶  getConversations()                         │
    │  (list my conversations)          prisma.conversation.findMany({            │
    │                                    where: { participants: { some: userId }},│
    │                                    include: {                               │
    │                                      participants: { select: safeUserSelect}│
    │                                      messages: { orderBy desc, take: 1 } ──▶│
    │                                    }})                                      │
    │◀─── [{ id, type, participants[], messages:[<lastMessage>] }, ...]           │
    │                                                                              │
    │  POST /api/chat           ────▶  createConversation()                       │
    │  { username }                     find-or-create conversation,              │
    │                                    emits "conversation:created" to           │
    │                                    each participant's user:<id> room ──────▶│
    │◀─── conversation object (201, or 200 if it already existed)                 │
    │                                                                              │
    │  GET /api/chat/:id        ────▶  getConversation()                          │
    │  (open a conversation)            prisma.conversation.findUnique({          │
    │                                    include: {                               │
    │                                      participants,                          │
    │                                      messages: { orderBy desc, take: 50 } ──▶│
    │                                    }})                                      │
    │                                    + 403 if userId not a participant        │
    │◀─── conversation + last 50 messages (newest-first)                          │
    │                                                                              │
    │  GET /api/chat/:id/messages ──▶  getMessages()                              │
    │  ?skip=0&take=50                  prisma.message.findMany({                 │
    │  (pagination / scroll-back)       where: { conversationId },                │
    │                                    orderBy: asc, skip, take,                │
    │                                    include: { user: safeUserSelect, media }─▶│
    │                                    }) + 403 if not a participant            │
    │◀─── messages[] (oldest-first, page of `take`, offset by `skip`)             │
    │                                                                              │
    │  DELETE /api/chat/:id     ────▶  deleteConversation()                       │
    │                                    + 403 if not a participant                │
    │                                    prisma.conversation.delete ─────────────▶ │
    │◀─── 204 No Content                                                          │
```

Notes:
- `getConversations`/`getConversation` order messages **newest-first** (`desc`) since they only
  grab a preview/recent window; `getMessages` (the actual scroll-back pagination endpoint) orders
  **oldest-first** (`asc`) since the frontend renders a chat log top-to-bottom. Don't assume one
  order applies to both.
- Every conversation-scoped route re-checks `isParticipant` server-side per request — there is no
  cached authorization, so a user removed from a conversation loses access on their very next call.
- All three participant-returning endpoints use `safeUserSelect` (`id, email, username, avatar,
  status, createdAt, updatedAt`) — `password` is never serialized to the client.
