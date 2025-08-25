import rateLimit from 'express-rate-limit';
import { config } from '../config/env';

export const rateLimiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.max,
  message: 'Too many requests, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});