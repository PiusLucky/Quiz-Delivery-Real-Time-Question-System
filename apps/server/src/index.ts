import { createServer } from "http";
import { Server } from "socket.io";
import mongoose from "mongoose";

import { createApp } from "./app.js";
import { quizSession } from "./services/quizSession.js";

const ioProxy = {
  emit: (_event: string, _payload: unknown) => {
    if (ioRef.current) ioRef.current.emit(_event, _payload);
  },
};
const ioRef = { current: null as Server | null };

const app = createApp(ioProxy);
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: process.env.CLIENT_URL || "http://localhost:3000",
    methods: ["GET", "POST"],
  },
  pingInterval: 5000,
  pingTimeout: 3000,
});
ioRef.current = io;

io.on("connection", (socket) => {
  const clientId = socket.handshake.query.clientId as string;
  if (!clientId) {
    socket.emit("error", { message: "clientId is required in query" });
    socket.disconnect(true);
    return;
  }

  socket.data.clientId = clientId;
  socket.join(`client:${clientId}`);

  socket.on("ack", async (payload: { seq: number }) => {
    const seq = payload?.seq;
    if (typeof seq !== "number" || seq < 1) {
      socket.emit("error", { message: "Invalid ack: seq must be a positive number" });
      return;
    }
    try {
      await quizSession.recordAck(clientId, seq);
    } catch (err) {
      console.error("Ack error:", err);
      socket.emit("error", { message: "Failed to record ack" });
    }
  });

  socket.on("disconnect", () => {
    console.log(`Client ${clientId} disconnected`);
  });
});

export { app };

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/quiz-delivery";
const PORT = process.env.PORT || 3001;

async function main() {
  await mongoose.connect(MONGODB_URI);
  console.log("MongoDB connected");

  await quizSession.initialize();

  httpServer.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

if (!process.env.JEST_WORKER_ID) {
  main().catch((err) => {
    console.error("Failed to start server:", err);
    process.exit(1);
  });
}
