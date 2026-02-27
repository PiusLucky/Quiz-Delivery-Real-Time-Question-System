"use client";

import { useState } from "react";
import { useQuizSocket } from "@/hooks/useQuizSocket";
import { QuestionDisplay } from "./QuestionDisplay";

export function QuizClient() {
  const [clientId, setClientId] = useState("");
  const [activeId, setActiveId] = useState<string | null>(null);

  const { questions, connected, gapWarning, reconcile } = useQuizSocket(
    activeId || ""
  );

  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault();
    const id = clientId.trim() || `client-${Date.now()}`;
    setActiveId(id);
  };

  const handleReconnect = () => {
    if (activeId) reconcile();
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
          type="submit"
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

  return (
    <div>
      <div className="status-bar">
        <span
          className={`status-dot ${connected ? "" : "disconnected"}`}
          title={connected ? "Connected" : "Disconnected"}
        />
        <span>{connected ? "Connected" : "Disconnected"}</span>
        <span style={{ color: "#666" }}>|</span>
        <span>Client: {activeId}</span>
        <span style={{ color: "#666" }}>|</span>
        <span>Questions: {questions.length}</span>
        {!connected && (
          <button
            onClick={handleReconnect}
            style={{
              marginLeft: "auto",
              padding: "0.4rem 0.8rem",
              background: "#6366f1",
              border: "none",
              borderRadius: "6px",
              color: "white",
              cursor: "pointer",
              fontSize: "0.875rem",
            }}
          >
            Reconcile
          </button>
        )}
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
