import { Router } from 'express';
import multer from 'multer';
import { createUploadJob, getJobStatus } from '../services/uploadPipeline';
import { logger } from '../utils/logger';

const router = Router();
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }
});

/**
 * @swagger
 * /upload:
 *   post:
 *     tags: [Upload]
 *     summary: Upload and index documents
 *     description: Upload PDF or Markdown files for processing and indexing
 *     requestBody:
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               files:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *                 maxItems: 10
 *     responses:
 *       200:
 *         description: Upload job created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 jobId:
 *                   type: string
 *                   description: Unique job identifier for tracking progress
 *       400:
 *         description: No files provided
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Upload failed
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/', upload.array('files', 10), async (req, res) => {
  try {
    const files = req.files as Express.Multer.File[];
    
    if (!files || files.length === 0) {
      return res.status(400).json({ error: 'No files provided' });
    }
    
    const uploadFiles = files.map(f => ({
      filename: f.originalname,
      buffer: f.buffer,
    }));
    
    const jobId = await createUploadJob(uploadFiles);
    
    res.json({ jobId });
  } catch (error: any) {
    logger.error('Upload endpoint error', { error: error.message });
    res.status(500).json({ error: 'Upload failed' });
  }
});

/**
 * @swagger
 * /upload/status:
 *   get:
 *     tags: [Upload]
 *     summary: Get upload job status
 *     description: Retrieve the progress status of an upload job
 *     parameters:
 *       - $ref: '#/components/parameters/jobId'
 *     responses:
 *       200:
 *         description: Job status retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/FileStatus'
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
router.get('/status', async (req, res) => {
  const { jobId } = req.query;
  
  if (!jobId || typeof jobId !== 'string') {
    return res.status(400).json({ error: 'jobId required' });
  }
  
  const status = getJobStatus(jobId);
  
  if (!status) {
    return res.status(404).json({ error: 'Job not found' });
  }
  
  res.json(status);
});

export default router;