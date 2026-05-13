# Signaling Server — Socket.IO Implementation Plan

## Context
MeetNote needs a signaling server to manage meeting rooms before MediaSoup (media) integration. This adds Socket.IO to the existing Express server for real-time room management: create, join, leave rooms, track participants, handle disconnections. No auth — anyone with a room ID can join with a display name.

## Files to Modify/Create

### 1. Install dependency
```
cd server && npm install socket.io
```

### 2. `server/src/types/index.ts` — MODIFY
Add all type definitions:
- **Domain types**: `Participant` (socketId, displayName, joinedAt), `Room` (roomId, participants Map, createdAt), `ParticipantInfo` (serializable DTO for wire format)
- **Socket.IO typed event maps**: `ClientToServerEvents`, `ServerToClientEvents`, `InterServerEvents`, `SocketData`
- **Payload types**: `CreateRoomPayload`, `JoinRoomPayload`, `LeaveRoomPayload`, `GetParticipantsPayload`, `RoomCreatedPayload`, `PeerJoinedPayload`, `PeerLeftPayload`, `ParticipantsListPayload`, `ErrorPayload`
- Use Socket.IO acknowledgement callbacks on `create-room`, `join-room`, `get-participants` for request-response semantics

### 3. `server/src/services/roomService.ts` — CREATE
In-memory room state management. No Socket.IO dependency — pure data operations:
- `createRoom()` → generates roomId via `crypto.randomUUID()`, stores Room
- `getRoom(roomId)` → lookup
- `addParticipant(roomId, socketId, displayName)` → adds to room's Map
- `removeParticipant(roomId, socketId)` → removes participant, auto-deletes room if empty
- `getParticipants(roomId)` → returns serialized `ParticipantInfo[]`
- Exported as singleton instance

### 4. `server/src/socket/roomHandler.ts` — CREATE
Socket.IO event handlers for room operations. Exports `registerRoomHandlers(io)`:
- **`create-room`**: validate displayName → `roomService.createRoom()` → `addParticipant()` → `socket.join(roomId)` → callback with roomId + participants
- **`join-room`**: validate → check room exists → `addParticipant()` → `socket.join(roomId)` → broadcast `peer-joined` to room → callback with participants list
- **`leave-room`**: `removeParticipant()` → `socket.leave(roomId)` → broadcast `peer-left`
- **`get-participants`**: validate → callback with participants list
- **`disconnect`**: iterate `socket.data.rooms` → remove from each room → broadcast `peer-left` for each → auto-cleanup empty rooms
- Input validation: displayName must be non-empty string, max 50 chars. Each handler wrapped in try-catch.

### 5. `server/src/socket/index.ts` — CREATE
Socket.IO server factory. `createSocketServer(httpServer)`:
- Creates typed `Server<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>`
- Configures CORS (origin from config)
- Calls `registerRoomHandlers(io)`
- Future: will also call `registerMediasoupHandlers(io)` here

### 6. `server/src/index.ts` — MODIFY
Refactor `app.listen()` → `http.createServer(app)` + `httpServer.listen()`:
```typescript
import { createServer } from "node:http";
import { createSocketServer } from "./socket/index";

const httpServer = createServer(app);
const io = createSocketServer(httpServer);
httpServer.listen(config.port, () => { ... });
```
Express continues handling HTTP requests identically. Socket.IO attaches to the same HTTP server.

### 7. `server/src/config/index.ts` — MODIFY
Add `cors.origin` config (reads from `CORS_ORIGIN` env var, defaults to `"*"`).

## Event Flow

```
Create Room:
  Client --create-room({displayName})--> Server
  Server: createRoom() + addParticipant() + socket.join()
  Server --callback({roomId, participants})--> Client

Join Room:
  Client B --join-room({roomId, displayName})--> Server
  Server: addParticipant() + socket.join()
  Server --peer-joined({peer})--> Client A (broadcast)
  Server --callback({roomId, participants})--> Client B

Leave Room:
  Client B --leave-room({roomId})--> Server
  Server: removeParticipant() + socket.leave()
  Server --peer-left({socketId, displayName})--> Client A (broadcast)

Disconnect:
  Client B drops connection
  Server: for each room in socket.data.rooms → removeParticipant()
  Server --peer-left--> remaining peers in each room
```

## Directory Structure After

```
server/src/
├── index.ts              (modified)
├── config/
│   └── index.ts          (modified — cors config)
├── routes/
│   └── index.ts          (unchanged)
├── services/
│   └── roomService.ts    (new)
├── socket/
│   ├── index.ts          (new — Socket.IO factory)
│   └── roomHandler.ts    (new — room event handlers)
└── types/
    └── index.ts          (modified — all types)
```

## Key Design Decisions
- **RoomService has no Socket.IO dependency** — pure state management, testable, reusable by REST endpoints and future MediaSoup handlers
- **Room type is extensible** — will later add `router`, `producers`, `transports` fields for MediaSoup
- **`socket.data.rooms`** tracks joined rooms per socket for clean disconnect handling
- **Ack callbacks** for request-response events; broadcast `emit` for notifications to other peers
- **`crypto.randomUUID()`** for room IDs — zero dependencies, built into Node.js
- **Multi-room per socket allowed** — keeps architecture flexible

## Verification
1. `cd server && npm run dev` — server starts without errors, logs "Socket.IO server initialized"
2. Connect a test Socket.IO client:
   - `create-room` with displayName → receive roomId in callback
   - Open second client, `join-room` with that roomId → first client receives `peer-joined`
   - Second client disconnects → first client receives `peer-left`
3. `GET /api/health` still returns `{ status: "ok" }` (Express unaffected)
