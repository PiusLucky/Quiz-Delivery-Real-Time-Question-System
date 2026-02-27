import request from "supertest";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";

import { app } from "../index.js";
import { quizSession } from "../services/quizSession.js";

let mongoServer: MongoMemoryServer | null = null;

beforeAll(async () => {
  const testUri = process.env.MONGODB_URI_TEST;
  if (testUri) {
    await mongoose.connect(testUri);
  } else {
    mongoServer = await MongoMemoryServer.create();
    await mongoose.connect(mongoServer.getUri());
  }
  await quizSession.initialize();
}, 120000);

afterAll(async () => {
  await mongoose.disconnect();
  if (mongoServer) await mongoServer.stop();
});

beforeEach(async () => {
  await mongoose.connection.db?.dropDatabase();
  await quizSession.initialize();
});

describe("GET /", () => {
  it("returns health check with status ok", async () => {
    const res = await request(app).get("/");

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({
      status: "ok",
      mongodb: "connected",
    });
    expect(res.body).toHaveProperty("timestamp");
    expect(res.body).toHaveProperty("uptime");
    expect(typeof res.body.uptime).toBe("number");
  });
});

describe("GET /api-docs.json", () => {
  it("returns OpenAPI spec as JSON", async () => {
    const res = await request(app).get("/api-docs.json");

    expect(res.status).toBe(200);
    expect(res.headers["content-type"]).toMatch(/application\/json/);
    expect(res.body).toHaveProperty("openapi", "3.0.0");
    expect(res.body).toHaveProperty("paths");
    expect(res.body.paths).toHaveProperty("/");
    expect(res.body.paths).toHaveProperty("/reconcile");
    expect(res.body.paths).toHaveProperty("/questions");
  });
});

describe("GET /reconcile", () => {
  it("returns 400 when clientId is missing", async () => {
    const res = await request(app).get("/reconcile");

    expect(res.status).toBe(400);
    expect(res.body).toEqual({ error: "clientId is required" });
  });

  it("returns 400 when lastSeq is invalid", async () => {
    const res = await request(app)
      .get("/reconcile")
      .query({ clientId: "client-1", lastSeq: "invalid" });

    expect(res.status).toBe(400);
    expect(res.body).toEqual({
      error: "lastSeq must be a non-negative integer",
    });
  });

  it("returns 400 when lastSeq is negative", async () => {
    const res = await request(app)
      .get("/reconcile")
      .query({ clientId: "client-1", lastSeq: "-1" });

    expect(res.status).toBe(400);
    expect(res.body).toEqual({
      error: "lastSeq must be a non-negative integer",
    });
  });

  it("returns empty questions for new client with lastSeq 0", async () => {
    const res = await request(app)
      .get("/reconcile")
      .query({ clientId: "client-1", lastSeq: "0" });

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ questions: [] });
  });

  it("returns missed questions not yet ACK'd by client", async () => {
    await request(app)
      .post("/questions")
      .send({ text: "Q1" });
    await request(app)
      .post("/questions")
      .send({ text: "Q2" });
    await request(app)
      .post("/questions")
      .send({ text: "Q3" });

    const res = await request(app)
      .get("/reconcile")
      .query({ clientId: "client-1", lastSeq: "0" });

    expect(res.status).toBe(200);
    expect(res.body.questions).toHaveLength(3);
    expect(res.body.questions[0]).toMatchObject({ seq: 1, text: "Q1" });
    expect(res.body.questions[1]).toMatchObject({ seq: 2, text: "Q2" });
    expect(res.body.questions[2]).toMatchObject({ seq: 3, text: "Q3" });
  });

  it("defaults lastSeq to 0 when not provided", async () => {
    await request(app).post("/questions").send({ text: "Q1" });

    const res = await request(app)
      .get("/reconcile")
      .query({ clientId: "client-1" });

    expect(res.status).toBe(200);
    expect(res.body.questions).toHaveLength(1);
  });
});

describe("POST /questions", () => {
  it("returns 400 when text is missing", async () => {
    const res = await request(app)
      .post("/questions")
      .send({});

    expect(res.status).toBe(400);
    expect(res.body).toEqual({ error: "text is required" });
  });

  it("creates question and returns 201 with payload", async () => {
    const res = await request(app)
      .post("/questions")
      .send({ text: "What is 2 + 2?" });

    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({
      seq: 1,
      text: "What is 2 + 2?",
    });
    expect(res.body).toHaveProperty("options");
  });

  it("creates question with options and correctAnswer", async () => {
    const res = await request(app)
      .post("/questions")
      .send({
        text: "Capital of France?",
        options: ["London", "Paris", "Berlin"],
        correctAnswer: "Paris",
      });

    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({
      seq: 1,
      text: "Capital of France?",
      options: ["London", "Paris", "Berlin"],
      correctAnswer: "Paris",
    });
  });

  it("assigns monotonically increasing sequence numbers", async () => {
    await request(app).post("/questions").send({ text: "Q1" });
    await request(app).post("/questions").send({ text: "Q2" });
    const res = await request(app).post("/questions").send({ text: "Q3" });

    expect(res.status).toBe(201);
    expect(res.body.seq).toBe(3);
  });
});

describe("GET /questions", () => {
  it("returns empty array when no questions exist", async () => {
    const res = await request(app).get("/questions");

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ questions: [] });
  });

  it("returns all questions in sequence order", async () => {
    await request(app).post("/questions").send({ text: "Q2" });
    await request(app).post("/questions").send({ text: "Q1" });
    await request(app).post("/questions").send({ text: "Q3" });

    const res = await request(app).get("/questions");

    expect(res.status).toBe(200);
    expect(res.body.questions).toHaveLength(3);
    expect(res.body.questions[0].seq).toBe(1);
    expect(res.body.questions[1].seq).toBe(2);
    expect(res.body.questions[2].seq).toBe(3);
  });
});
