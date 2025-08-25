import { Router } from 'express';
import multer from 'multer';
import { TicketRepository } from '../repositories/ticketRepository';
import { createIngestJob, getIngestStatus } from '../services/csvIngest';
import { logger } from '../utils/logger';

const router = Router();
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 }
});

/**
 * @swagger
 * /tickets/ingest-csv:
 *   post:
 *     tags: [Tickets]
 *     summary: Ingest tickets from CSV file
 *     description: Upload and process a CSV file containing support tickets
 *     requestBody:
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Ingest job created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 jobId:
 *                   type: string
 */
router.post('/ingest-csv', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file provided' });
    }
    
    const jobId = await createIngestJob(req.file.buffer);
    res.json({ jobId });
  } catch (error: any) {
    logger.error('CSV ingest error', { error: error.message });
    res.status(500).json({ error: 'Ingest failed' });
  }
});

/**
 * @swagger
 * /tickets/ingest/status:
 *   get:
 *     tags: [Tickets]
 *     summary: Get CSV ingest job status
 *     description: Retrieve the progress status of a CSV ingest job
 *     parameters:
 *       - $ref: '#/components/parameters/jobId'
 *     responses:
 *       200:
 *         description: Ingest job status retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 processed:
 *                   type: number
 *                 total:
 *                   type: number
 *                 batchesDone:
 *                   type: number
 *                 status:
 *                   type: string
 *                 error:
 *                   type: string
 *       400:
 *         description: Job ID required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Job not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/ingest/status', async (req, res) => {
  const { jobId } = req.query;
  
  if (!jobId || typeof jobId !== 'string') {
    return res.status(400).json({ error: 'jobId required' });
  }
  
  const status = getIngestStatus(jobId);
  
  if (!status) {
    return res.status(404).json({ error: 'Job not found' });
  }
  
  res.json({
    processed: status.processed,
    total: status.total,
    batchesDone: status.batchesDone,
    status: status.status,
    error: status.error,
  });
});

/**
 * @swagger
 * /tickets:
 *   get:
 *     tags: [Tickets]
 *     summary: Get all tickets
 *     description: Retrieve all support tickets from the database
 *     responses:
 *       200:
 *         description: List of tickets retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Ticket'
 */
router.get('/', async (req, res) => {
  try {
    const ticketRepo = new TicketRepository();
    const tickets = await ticketRepo.findAll();
    res.json(tickets);
  } catch (error: any) {
    logger.error('Get tickets error', { error: error.message });
    res.status(500).json({ error: 'Failed to fetch tickets' });
  }
});

router.get('/search', async (req, res) => {
  try {
    const { q } = req.query;
    
    if (!q || typeof q !== 'string') {
      return res.status(400).json({ error: 'Search query required' });
    }
    
    const ticketRepo = new TicketRepository();
    const tickets = await ticketRepo.search(q);
    res.json(tickets);
  } catch (error: any) {
    logger.error('Search tickets error', { error: error.message });
    res.status(500).json({ error: 'Search failed' });
  }
});

export default router;