"use client";

import { useState } from "react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

export default function AdminPage() {
  const [text, setText] = useState("");
  const [options, setOptions] = useState("");
  const [status, setStatus] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus(null);
    try {
      const res = await fetch(`${API_URL}/questions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: text.trim(),
          options: options.trim() ? options.split("\n").map((o) => o.trim()) : undefined,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setStatus(`Question #${data.seq} added!`);
        setText("");
        setOptions("");
      } else {
        setStatus(`Error: ${data.error || res.status}`);
      }
    } catch (err) {
      setStatus(`Error: ${(err as Error).message}`);
    }
  };

  return (
    <main style={{ padding: "2rem", maxWidth: "560px", margin: "0 auto" }}>
      <h1 style={{ fontSize: "1.5rem", marginBottom: "1rem" }}>Add Question</h1>
      <form onSubmit={handleSubmit}>
        <label style={{ display: "block", marginBottom: "0.5rem", color: "#888" }}>
          Question text (LaTeX supported: use backslash-frac for fractions)
        </label>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          required
          rows={3}
          style={{
            width: "100%",
            padding: "0.75rem",
            background: "#1a1a20",
            border: "1px solid #2a2a32",
            borderRadius: "8px",
            color: "#e8e8ed",
            marginBottom: "1rem",
          }}
        />
        <label style={{ display: "block", marginBottom: "0.5rem", color: "#888" }}>
          Options (one per line, optional)
        </label>
        <textarea
          value={options}
          onChange={(e) => setOptions(e.target.value)}
          rows={3}
          placeholder="Option A&#10;Option B&#10;Option C"
          style={{
            width: "100%",
            padding: "0.75rem",
            background: "#1a1a20",
            border: "1px solid #2a2a32",
            borderRadius: "8px",
            color: "#e8e8ed",
            marginBottom: "1rem",
          }}
        />
        <button
          type="submit"
          style={{
            padding: "0.75rem 1.5rem",
            background: "#6366f1",
            border: "none",
            borderRadius: "8px",
            color: "white",
            cursor: "pointer",
            fontWeight: 600,
          }}
        >
          Add Question
        </button>
      </form>
      {status && (
        <p style={{ marginTop: "1rem", color: status.startsWith("Error") ? "#ef4444" : "#22c55e" }}>
          {status}
        </p>
      )}
      <p style={{ marginTop: "2rem" }}>
        <a href="/" style={{ color: "#6366f1" }}>← Back to Quiz</a>
      </p>
    </main>
  );
}
