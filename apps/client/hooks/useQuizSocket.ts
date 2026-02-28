"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { Socket } from "socket.io-client";
import { createSocket, fetchReconcile } from "@/lib/socket";

export interface QuestionData {
  seq: number;
  text: string;
  options?: string[];
  correctAnswer?: string;
}

export interface QuizState {
  questions: QuestionData[];
  lastSeq: number;
  connected: boolean;
  clientId: string;
  gapWarning: string | null;
}

export function useQuizSocket(clientId: string) {
  const [state, setState] = useState<QuizState>({
    questions: [],
    lastSeq: 0,
    connected: false,
    clientId,
    gapWarning: null,
  });
  const socketRef = useRef<Socket | null>(null);
  const lastSeqRef = useRef(0);

  const reconcile = useCallback(async () => {
    if (!clientId) return;
    try {
      const { questions } = await fetchReconcile(clientId, lastSeqRef.current);
      if (Array.isArray(questions) && questions.length > 0) {
        setState((prev) => ({
          ...prev,
          questions: [...prev.questions, ...questions].sort((a, b) => a.seq - b.seq),
          lastSeq: Math.max(prev.lastSeq, ...questions.map((q: QuestionData) => q.seq)),
        }));
        lastSeqRef.current = Math.max(lastSeqRef.current, ...questions.map((q: QuestionData) => q.seq));
        questions.forEach((q: QuestionData) => socketRef.current?.emit("ack", { seq: q.seq }));
      }
    } catch (err) {
      console.error("Reconcile error:", err);
    }
  }, [clientId]);

  useEffect(() => {
    if (!clientId) return;

    const socket = createSocket(clientId);
    socketRef.current = socket;

    socket.on("connect", () => {
      setState((prev) => ({ ...prev, connected: true }));
      reconcile();
    });

    socket.on("disconnect", () => {
      setState((prev) => ({ ...prev, connected: false }));
    });

    const handleOffline = () => {
      setState((prev) => ({ ...prev, connected: false }));
    };
    const handleOnline = () => {
      if (socketRef.current && !socketRef.current.connected) {
        socketRef.current.connect();
      }
    };
    window.addEventListener("offline", handleOffline);
    window.addEventListener("online", handleOnline);

    socket.on("question", (payload: QuestionData) => {
      const { seq, text, options, correctAnswer } = payload;
      const expected = lastSeqRef.current + 1;

      if (seq > expected && lastSeqRef.current > 0) {
        const msg = `WARNING: Gap detected — expected seq ${expected}, received seq ${seq}`;
        setState((prev) => ({ ...prev, gapWarning: msg }));
        console.warn(msg);
      } else {
        setState((prev) => ({ ...prev, gapWarning: null }));
      }

      setState((prev) => ({
        ...prev,
        questions: [...prev.questions, { seq, text, options, correctAnswer }].sort((a, b) => a.seq - b.seq),
        lastSeq: Math.max(prev.lastSeq, seq),
      }));
      lastSeqRef.current = seq;
      socket.emit("ack", { seq });
    });

    socket.on("error", (err: { message?: string }) => {
      console.error("Socket error:", err);
    });

    return () => {
      window.removeEventListener("offline", handleOffline);
      window.removeEventListener("online", handleOnline);
      socket.disconnect();
      socketRef.current = null;
    };
  }, [clientId, reconcile]);

  return { ...state, reconcile };
}
