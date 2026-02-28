"use client";

import { useState, useEffect, useRef } from "react";
import { useQuizSocket } from "@/hooks/useQuizSocket";
import { useToast } from "@/components/Toast";
import { QuestionDisplay } from "./QuestionDisplay";

function QuizView({ activeId }: { activeId: string }) {
  const { toast } = useToast();
  const prevConnectedRef = useRef<boolean | null>(null);
  const { questions, connected, connectionStatus, gapWarning } = useQuizSocket(activeId);

  useEffect(() => {
    if (prevConnectedRef.current === null) {
      prevConnectedRef.current = connected;
      return;
    }
    if (prevConnectedRef.current !== connected && connectionStatus !== "connecting") {
      toast(
        connected ? "Connected" : "Disconnected",
        connected ? "success" : "error"
      );
      prevConnectedRef.current = connected;
    }
  }, [activeId, connected, connectionStatus, toast]);

  return (
    <div>
      <div className="status-bar">
        <span
          className={`status-dot ${connectionStatus === "connected" ? "" : connectionStatus === "connecting" ? "connecting" : "disconnected"}`}
          title={connectionStatus === "connected" ? "Connected" : connectionStatus === "connecting" ? "Connecting..." : "Disconnected"}
        />
        <span>
          {connectionStatus === "connected"
            ? "Connected"
            : connectionStatus === "connecting"
              ? "Connecting..."
              : "Disconnected"}
        </span>
        <span style={{ color: "#666" }}>|</span>
        <span>Client: {activeId}</span>
        <span style={{ color: "#666" }}>|</span>
        <span>Questions: {questions.length}</span>
      </div>

      {gapWarning && (
        <div className="gap-warning">
          {gapWarning}
        </div>
      )}

      <div style={{ marginTop: "1.5rem" }}>
        {questions.length === 0 ? (
          <p style={{ color: "#666" }}>
            Waiting for questions... Open another tab to add questions via the
            admin API, or use curl: POST /questions with {"{ \"text\": \"...\" }"}
          </p>
        ) : (
          questions.map((q) => <QuestionDisplay key={q.seq} question={q} />)
        )}
      </div>
    </div>
  );
}

export function QuizClient() {
  const [clientId, setClientId] = useState("");
  const [activeId, setActiveId] = useState<string | null>(null);
  const isJoiningRef = useRef(false);

  const handleJoin = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (isJoiningRef.current) return;
    isJoiningRef.current = true;
    const id = clientId.trim() || `client-${Date.now()}`;
    setActiveId(id);
  };

  if (!activeId) {
    return (
      <form onSubmit={handleJoin}>
        <input
          type="text"
          placeholder="Enter client ID (or leave blank for auto)"
          value={clientId}
          onChange={(e) => setClientId(e.target.value)}
          style={{
            padding: "0.75rem 1rem",
            width: "100%",
            maxWidth: "400px",
            background: "#1a1a20",
            border: "1px solid #2a2a32",
            borderRadius: "8px",
            color: "#e8e8ed",
            marginRight: "0.5rem",
          }}
        />
        <button
          type="button"
          onClick={handleJoin}
          style={{
            marginTop: "1rem",
            padding: "0.75rem 1.5rem",
            background: "#6366f1",
            border: "none",
            borderRadius: "8px",
            color: "white",
            cursor: "pointer",
            fontWeight: 600,
          }}
        >
          Join Quiz
        </button>
      </form>
    );
  }

  return <QuizView key={activeId} activeId={activeId} />;
}
