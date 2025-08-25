import winston from 'winston';

const maskPII = (message: string): string => {
  const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
  const phoneRegex = /(\+?\d{1,3}[-.\s]?)?\(?\d{1,4}\)?[-.\s]?\d{1,4}[-.\s]?\d{1,9}/g;
  
  return message
    .replace(emailRegex, '<MASKED_EMAIL>')
    .replace(phoneRegex, '<MASKED_PHONE>');
};

const piiMaskFormat = winston.format((info) => {
  if (typeof info.message === 'string') {
    info.message = maskPII(info.message);
  }
  if (info.error && typeof info.error === 'string') {
    info.error = maskPII(info.error);
  }
  return info;
});

export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    piiMaskFormat(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      ),
    }),
  ],
});