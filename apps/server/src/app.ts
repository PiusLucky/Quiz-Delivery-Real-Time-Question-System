import express, { Express } from "express";
import cors from "cors";
import mongoose from "mongoose";
import swaggerUi from "swagger-ui-express";

import { quizSession } from "./services/quizSession.js";
import { swaggerSpec } from "./swagger.js";

export type SocketEmitter = { emit: (event: string, payload: unknown) => void };

export function createApp(io: SocketEmitter): Express {
  const app = express();

  app.use(cors());
  app.use(express.json());

  // Health check - GET /
  app.get("/", (_req, res) => {
    res.json({
      status: "ok",
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      mongodb: mongoose.connection.readyState === 1 ? "connected" : "disconnected",
    });
  });

  // Swagger API docs
  app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
  app.get("/api-docs.json", (_req, res) => {
    res.setHeader("Content-Type", "application/json");
    res.send(swaggerSpec);
  });

  // GET /reconcile?clientId=XXX&lastSeq=N - catch up on missed questions
  app.get("/reconcile", async (req, res) => {
    try {
      const clientId = req.query.clientId as string;
      const lastSeqParam = req.query.lastSeq as string;

      if (!clientId) {
        return res.status(400).json({ error: "clientId is required" });
      }

      const lastSeq = lastSeqParam ? parseInt(lastSeqParam, 10) : 0;
      if (isNaN(lastSeq) || lastSeq < 0) {
        return res.status(400).json({ error: "lastSeq must be a non-negative integer" });
      }

      const questions = await quizSession.getReconcileQuestions(clientId, lastSeq);
      res.json({
        questions: questions.map((q) => ({
          seq: q.seq,
          text: q.text,
          options: q.options,
          correctAnswer: q.correctAnswer,
        })),
      });
    } catch (err) {
      console.error("Reconcile error:", err);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // POST /questions - add a new question (for testing/admin)
  app.post("/questions", async (req, res) => {
    try {
      const { text, options, correctAnswer } = req.body;
      if (!text) {
        return res.status(400).json({ error: "text is required" });
      }
      const question = await quizSession.addQuestion(text, options, correctAnswer);
      const payload = {
        seq: question.seq,
        text: question.text,
        options: question.options,
        correctAnswer: question.correctAnswer,
      };
      io.emit("question", payload);
      res.status(201).json(payload);
    } catch (err) {
      console.error("Add question error:", err);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // GET /questions - list all questions
  app.get("/questions", async (_req, res) => {
    try {
      const questions = await quizSession.getAllQuestions();
      res.json({
        questions: questions.map((q) => ({
          seq: q.seq,
          text: q.text,
          options: q.options,
          correctAnswer: q.correctAnswer,
        })),
      });
    } catch (err) {
      console.error("List questions error:", err);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  return app;
}
