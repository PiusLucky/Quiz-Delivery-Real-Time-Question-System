# Quiz Delivery - Real-Time Question System

A reliable real-time quiz question delivery system built with Next.js, Socket.IO, Express, TypeScript, and MongoDB.
API DOC: http://localhost:3001/api-docs

## Features

- **Sequence-numbered questions** — Monotonically increasing seq (1, 2, 3...)
- **Per-client ACK tracking** — Server tracks which questions each client has acknowledged
- **Gap detection** — Client warns when sequence jumps (e.g., receives seq 4 after seq 2)
- **Reconcile endpoint** — `GET /reconcile?clientId=XXX&lastSeq=N` for reconnecting clients to catch up
- **MongoDB persistence** — Questions and ACK state stored in MongoDB
- **LaTeX support** — Questions with LaTeX (e.g. `\frac{x^2-1}{x+1}`) rendered via KaTeX

## Quick Start (< 5 minutes)

### Prerequisites

- Node.js 18+
- MongoDB running locally (or use [MongoDB Atlas](https://www.mongodb.com/atlas) free tier)

### 1. Install dependencies

```bash
npm install
```

### 2. Start MongoDB (if not already running)

```bash
# Windows (if MongoDB is installed as service)
net start MongoDB

# macOS / Linux
mongod
```

Or use MongoDB Atlas — set `MONGODB_URI` in `.env` (see below).

### 3. Run the app

```bash
npm run dev
```

This starts:
- **Server** on http://localhost:3001
- **Client** on http://localhost:3000

### 4. Test it

1. Open http://localhost:3000 in your browser
2. Enter a client ID (or leave blank for auto-generated) and click **Join Quiz**
3. Add questions via the Admin page (http://localhost:3000/admin) or via API:

```bash
curl -X POST http://localhost:3001/questions -H "Content-Type: application/json" -d "{\"text\": \"What is 2 + 2?\", \"options\": [\"3\", \"4\", \"5\"]}"
```

4. Add a LaTeX question: Adding via Admin UI
    In the admin form, use single backslashes, e.g.:
    ```bash
    \frac{x^2 - 1}{x + 1}
    \sqrt{2}
    \text{Solve } \frac{x^2 - 1}{x + 1}
    ```


5. Open a second browser tab with a different client ID to simulate multi-client behavior (each tab has independent ACK state)
6. Disconnect (close tab or turn off network) and reconnect — the client will call `/reconcile` to catch up

## Project Structure (Monorepo)

```
quiz-delivery-monorepo/
├── apps/
│   ├── server/          # Express + Socket.IO + MongoDB
│   │   └── src/
│   │       ├── index.ts
│   │       ├── models/
│   │       └── services/
│   └── client/          # Next.js + Socket.IO client
│       ├── app/
│       ├── components/
│       ├── hooks/
│       └── lib/
├── pnpm-workspace.yaml
├── package.json
└── README.md
```

## API Reference

### REST Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | Health check - returns status, uptime, MongoDB connection state |
| GET | `/api-docs` | Swagger UI - interactive API documentation |
| GET | `/api-docs.json` | OpenAPI spec (JSON) |
| GET | `/reconcile?clientId=XXX&lastSeq=N` | Returns questions with seq > N not yet ACK'd by client |
| POST | `/questions` | Add a question `{ "text": "...", "options": [...], "correctAnswer": "..." }` |
| GET | `/questions` | List all questions |

### Socket.IO Events

| Event | Direction | Payload |
|-------|-----------|---------|
| `question` | Server → Client | `{ seq, text, options?, correctAnswer? }` |
| `ack` | Client → Server | `{ seq }` |
| `error` | Server → Client | `{ message }` |

### Connection

Connect with `clientId` in query:

```js
io("http://localhost:3001", { query: { clientId: "student-1" } });
```

## Environment Variables

Create `.env` in project root or `apps/server`:

| Variable | Default | Description |
|----------|---------|-------------|
| `MONGODB_URI` | `mongodb://localhost:27017/quiz-delivery` | MongoDB connection string |
| `PORT` | `3001` | Server port |
| `CLIENT_URL` | `http://localhost:3000` | CORS origin for Socket.IO |
| `NEXT_PUBLIC_SOCKET_URL` | `http://localhost:3001` | Socket URL for client |
| `NEXT_PUBLIC_API_URL` | `http://localhost:3001` | API base URL for client |

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Run server + client in dev mode |
| `npm run dev:server` | Run server only |
| `npm run dev:client` | Run client only |
| `npm run build` | Build all packages |
| `npm run start` | Run production builds |
| `npm run test -w server` | Run API endpoint tests |

## License

MIT
