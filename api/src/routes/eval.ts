import { Router } from 'express';
import { runEvaluation } from '../services/evaluation';
import { EvalRepository } from '../repositories/evalRepository';
import { ProviderType } from '../providers/types';
import { logger } from '../utils/logger';

const router = Router();

/**
 * @swagger
 * /eval/run:
 *   post:
 *     tags: [Evaluation]
 *     summary: Run evaluation tests
 *     description: Execute evaluation tests against the RAG system
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 description: Name for this evaluation run
 *               model:
 *                 type: string
 *                 enum: [mock, gemini, groq]
 *                 description: Model provider to test
 *               testCases:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     q:
 *                       type: string
 *                     a:
 *                       type: string
 *     responses:
 *       200:
 *         description: Evaluation completed successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/EvalRun'
 */
router.post('/run', async (req, res) => {
  try {
    const { name, model, testCases } = req.body;
    
    const evalRun = await runEvaluation(
      name || 'API Eval',
      model as ProviderType,
      testCases
    );
    
    res.json(evalRun);
  } catch (error: any) {
    logger.error('Eval run error', { error: error.message });
    res.status(500).json({ error: 'Evaluation failed' });
  }
});

router.get('/runs', async (req, res) => {
  try {
    const evalRepo = new EvalRepository();
    const runs = await evalRepo.findAll();
    res.json(runs);
  } catch (error: any) {
    logger.error('Get eval runs error', { error: error.message });
    res.status(500).json({ error: 'Failed to fetch runs' });
  }
});

export default router;