import dotenv from 'dotenv';

dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || '4000', 10),
  mongoUri: process.env.MONGO_URI || '',
  
  models: {
    default: process.env.DEFAULT_MODEL || 'groq',
    enabled: (process.env.ENABLED_MODELS || 'mock,gemini,groq').split(','),
  },
  
  gemini: {
    apiKey: process.env.GEMINI_API_KEY || '',
    chatModel: process.env.GEMINI_CHAT_MODEL || 'gemini-1.5-flash',
    embedModel: process.env.GEMINI_EMBED_MODEL || 'text-embedding-004',
  },
  
  groq: {
    apiKey: process.env.GROQ_API_KEY || '',
    chatModel: process.env.GROQ_CHAT_MODEL || 'llama-3.1-8b-instant',
  },
  
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000', 10),
    max: parseInt(process.env.RATE_LIMIT_MAX || '60', 10),
  },
};