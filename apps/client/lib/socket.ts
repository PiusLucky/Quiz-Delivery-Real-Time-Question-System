import { io, Socket } from "socket.io-client";

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:3001";

export function createSocket(clientId: string): Socket {
  return io(SOCKET_URL, {
    query: { clientId },
    transports: ["websocket", "polling"],
    reconnection: true,
    reconnectionAttempts: 10,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
  });
}

export async function fetchReconcile(clientId: string, lastSeq: number) {
  const base = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
  const url = `${base}/reconcile?clientId=${encodeURIComponent(clientId)}&lastSeq=${lastSeq}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Reconcile failed: ${res.status}`);
  return res.json();
}
