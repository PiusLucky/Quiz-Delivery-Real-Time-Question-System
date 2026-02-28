import { QuizClient } from "@/components/QuizClient";

export default function Home() {
  return (
    <main style={{ padding: "2rem", maxWidth: "720px", margin: "0 auto" }}>
      <h1 style={{ fontSize: "1.75rem", marginBottom: "0.5rem" }}>
        Quiz Delivery
      </h1>
      <p style={{ color: "#888", marginBottom: "1rem" }}>
        Real-time question delivery with sequence tracking and reconciliation
      </p>
      <p style={{ marginBottom: "2rem" }}>
        <a href="/admin" target="_blank" rel="noopener noreferrer" style={{ color: "#6366f1" }}>Add questions (Admin) →</a>
      </p>
      <QuizClient />
    </main>
  );
}
