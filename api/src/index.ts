import express from 'express';
import cors from 'cors';
import swaggerUi from 'swagger-ui-express';
import { swaggerSpec } from './config/swagger';
import { config } from './config/env';
import { connectToDatabase, closeDatabase } from './db/connection';
import { logger } from './utils/logger';
import { metricsMiddleware, getMetrics } from './middleware/metrics';
import { rateLimiter } from './middleware/rateLimiter';

import uploadRoutes from './routes/upload';
import chatRoutes from './routes/chat';
import ticketsRoutes from './routes/tickets';
import evalRoutes from './routes/eval';
import providersRoutes from './routes/providers';

const app = express();

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(metricsMiddleware);
app.use(rateLimiter);

// Swagger documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  explorer: true,
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'Support KB RAG API Documentation',
}));

app.use('/upload', uploadRoutes);
app.use('/chat', chatRoutes);
app.use('/tickets', ticketsRoutes);
app.use('/eval', evalRoutes);
app.use('/providers', providersRoutes);

/**
 * @swagger
 * /metrics:
 *   get:
 *     tags: [Monitoring]
 *     summary: Get Prometheus metrics
 *     description: Retrieve metrics data in Prometheus format
 *     responses:
 *       200:
 *         description: Metrics data
 *         content:
 *           text/plain:
 *             schema:
 *               type: string
 */
app.get('/metrics', async (_req, res) => {
  res.set('Content-Type', 'text/plain');
  res.send(await getMetrics());
});

/**
 * @swagger
 * /health:
 *   get:
 *     tags: [Monitoring]
 *     summary: Health check
 *     description: Check if the API is running and healthy
 *     responses:
 *       200:
 *         description: Service is healthy
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: healthy
 */
app.get('/health', (_req, res) => {
  res.json({ status: 'healthy' });
});

async function start() {
  try {
    await connectToDatabase();
    
    app.listen(config.port, () => {
      logger.info(`Server running on port ${config.port}`);
    });
  } catch (error) {
    logger.error('Failed to start server', error);
    process.exit(1);
  }
}

process.on('SIGINT', async () => {
  logger.info('Shutting down gracefully');
  await closeDatabase();
  process.exit(0);
});

start();