import { Router } from 'express';
import { getProviderStatus } from '../providers/factory';
import { config } from '../config/env';

const router = Router();

/**
 * @swagger
 * /providers/status:
 *   get:
 *     tags: [Providers]
 *     summary: Get provider status
 *     description: Check availability status of all AI model providers
 *     responses:
 *       200:
 *         description: Provider status retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ProviderStatus'
 */
router.get('/status', async (req, res) => {
  const status = await getProviderStatus();
  res.json({
    default: config.models.default,
    enabled: config.models.enabled,
    status,
  });
});

export default router;