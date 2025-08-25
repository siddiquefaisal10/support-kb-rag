import { Router } from 'express';
import { performRAGQuery } from '../services/ragService';
import { SSEStream } from '../utils/sse';
import { ProviderType } from '../providers/types';
import { logger } from '../utils/logger';

const router = Router();

/**
 * @swagger
 * /chat:
 *   post:
 *     tags: [Chat]
 *     summary: RAG Chat with SSE streaming
 *     description: Send a query to the RAG system and receive streaming responses with citations
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - query
 *             properties:
 *               query:
 *                 type: string
 *                 description: User question or query
 *               model:
 *                 type: string
 *                 enum: [mock, gemini, groq]
 *                 description: AI model provider to use
 *     responses:
 *       200:
 *         description: Server-sent events stream with tokens and citations
 *         headers:
 *           Content-Type:
 *             description: text/event-stream
 *             schema:
 *               type: string
 *               example: text/event-stream
 *           Cache-Control:
 *             description: no-cache, no-transform
 *             schema:
 *               type: string
 *       400:
 *         description: Query required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/', async (req, res) => {
  const { query, model } = req.body;
  
  if (!query) {
    return res.status(400).json({ error: 'Query required' });
  }
  
  const sse = new SSEStream(res);
  
  try {
    const startTime = Date.now();
    
    const response = await performRAGQuery(
      query,
      model as ProviderType,
      (token) => {
        sse.sendToken(token);
      }
    );
    
    const latency = Date.now() - startTime;
    
    sse.sendDone({
      citations: response.citations,
      latency,
      quotaExceeded: response.quotaExceeded,
    });
    
  } catch (error: any) {
    logger.error('Chat error', { error: error.message, query });
    sse.sendError(error.message);
  } finally {
    sse.close();
  }
});

export default router;