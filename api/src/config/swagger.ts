import swaggerJSDoc from 'swagger-jsdoc';

const options: swaggerJSDoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Support KB RAG API',
      version: '1.0.0',
      description: 'A support knowledge base RAG (Retrieval-Augmented Generation) API with document upload, chat functionality, and ticket management.',
      contact: {
        name: 'Support KB RAG',
        email: 'siddiquefaisal126@gmail.com',
      },
    },
    servers: [
      {
        url: 'http://localhost:4000',
        description: 'Development server',
      },
    ],
    components: {
      schemas: {
        FileStatus: {
          type: 'object',
          properties: {
            fileId: { type: 'string' },
            filename: { type: 'string' },
            stages: {
              type: 'object',
              properties: {
                uploaded: { type: 'boolean' },
                extracted: { type: 'boolean' },
                chunked: { type: 'boolean' },
                indexed: { type: 'boolean' },
              },
            },
            error: { type: 'string' },
          },
        },
        Citation: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            source: { type: 'string' },
            text: { type: 'string' },
          },
        },
        Ticket: {
          type: 'object',
          properties: {
            _id: { type: 'string' },
            subject: { type: 'string' },
            body: { type: 'string' },
            tags: { 
              type: 'array',
              items: { type: 'string' },
            },
            createdAt: { type: 'string', format: 'date-time' },
            embedding: {
              type: 'array',
              items: { type: 'number' },
            },
          },
        },
        EvalRun: {
          type: 'object',
          properties: {
            _id: { type: 'string' },
            name: { type: 'string' },
            cases: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  q: { type: 'string' },
                  a: { type: 'string' },
                  pred: { type: 'string' },
                  correct: { type: 'boolean' },
                },
              },
            },
            accuracy: { type: 'number' },
            accuracyContains: { type: 'number' },
            latency: {
              type: 'object',
              properties: {
                p50: { type: 'number' },
                p95: { type: 'number' },
              },
            },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },
        ProviderStatus: {
          type: 'object',
          properties: {
            default: { type: 'string' },
            enabled: {
              type: 'array',
              items: { type: 'string' },
            },
            status: {
              type: 'object',
              additionalProperties: { type: 'boolean' },
            },
          },
        },
        Error: {
          type: 'object',
          properties: {
            error: { type: 'string' },
          },
        },
      },
      parameters: {
        jobId: {
          name: 'jobId',
          in: 'query',
          required: true,
          schema: { type: 'string' },
          description: 'Job ID for tracking upload/ingest progress',
        },
        searchQuery: {
          name: 'q',
          in: 'query',
          required: true,
          schema: { type: 'string' },
          description: 'Search query string',
        },
      },
    },
  },
  apis: ['./src/routes/*.ts', './src/index.ts'],
};

export const swaggerSpec = swaggerJSDoc(options);