import swaggerJsdoc from "swagger-jsdoc";

const PORT = process.env.PORT || 3001;

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Quiz Delivery API",
      version: "1.0.0",
      description: "Real-time quiz question delivery system - REST API",
    },
    servers: [
      { url: `http://localhost:${PORT}`, description: "Development server" },
    ],
    paths: {
      "/": {
        get: {
          summary: "Health check",
          description: "Returns API status and health information",
          tags: ["Health"],
          responses: {
            200: {
              description: "API is healthy",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      status: { type: "string", example: "ok" },
                      timestamp: { type: "string", format: "date-time" },
                      uptime: { type: "number", description: "Process uptime in seconds" },
                      mongodb: { type: "string", example: "connected" },
                    },
                  },
                },
              },
            },
          },
        },
      },
      "/reconcile": {
        get: {
          summary: "Reconcile missed questions",
          description: "Returns questions with seq > lastSeq that the client has not yet ACK'd. Used when reconnecting to catch up on missed questions.",
          tags: ["Questions"],
          parameters: [
            {
              name: "clientId",
              in: "query",
              required: true,
              schema: { type: "string" },
              description: "Unique client identifier",
            },
            {
              name: "lastSeq",
              in: "query",
              required: false,
              schema: { type: "integer", default: 0 },
              description: "Last sequence number the client received",
            },
          ],
          responses: {
            200: {
              description: "List of missed questions",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      questions: {
                        type: "array",
                        items: { $ref: "#/components/schemas/Question" },
                      },
                    },
                  },
                },
              },
            },
            400: { description: "Bad request - clientId required or invalid lastSeq" },
            500: { description: "Internal server error" },
          },
        },
      },
      "/questions": {
        get: {
          summary: "List all questions",
          description: "Returns all questions in sequence order",
          tags: ["Questions"],
          responses: {
            200: {
              description: "List of all questions",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      questions: {
                        type: "array",
                        items: { $ref: "#/components/schemas/Question" },
                      },
                    },
                  },
                },
              },
            },
            500: { description: "Internal server error" },
          },
        },
        post: {
          summary: "Add a question",
          description: "Creates a new question and broadcasts it to all connected clients via Socket.IO",
          tags: ["Questions"],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["text"],
                  properties: {
                    text: { type: "string", description: "Question text (LaTeX supported)" },
                    options: {
                      type: "array",
                      items: { type: "string" },
                      description: "Answer options",
                    },
                    correctAnswer: { type: "string", description: "Correct answer" },
                  },
                },
              },
            },
          },
          responses: {
            201: {
              description: "Question created",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/Question" },
                },
              },
            },
            400: { description: "Bad request - text is required" },
            500: { description: "Internal server error" },
          },
        },
      },
    },
    components: {
      schemas: {
        Question: {
          type: "object",
          properties: {
            seq: { type: "integer", description: "Sequence number" },
            text: { type: "string", description: "Question text" },
            options: {
              type: "array",
              items: { type: "string" },
              description: "Answer options",
            },
            correctAnswer: { type: "string", description: "Correct answer" },
          },
        },
      },
    },
  },
  apis: [],
};

export const swaggerSpec = swaggerJsdoc(options);
