import { Readable } from 'stream';
import csv from 'csv-parser';
import { v4 as uuidv4 } from 'uuid';
import { TicketRepository } from '../repositories/ticketRepository';
import { getEmbeddingsProvider } from '../providers/factory';
import { Ticket } from '../models/types';
import { logger } from '../utils/logger';

interface IngestJob {
  jobId: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  processed: number;
  total: number;
  batchesDone: number;
  error?: string;
}

const ingestJobs = new Map<string, IngestJob>();
const BATCH_SIZE = 1000;

export async function createIngestJob(csvBuffer: Buffer): Promise<string> {
  const jobId = uuidv4();
  const job: IngestJob = {
    jobId,
    status: 'pending',
    processed: 0,
    total: 0,
    batchesDone: 0,
  };
  
  ingestJobs.set(jobId, job);
  
  processCSV(csvBuffer, job).catch(err => {
    logger.error('CSV ingest failed', { jobId, error: err.message });
    job.status = 'failed';
    job.error = err.message;
  });
  
  return jobId;
}

export function getIngestStatus(jobId: string): IngestJob | null {
  return ingestJobs.get(jobId) || null;
}

async function processCSV(csvBuffer: Buffer, job: IngestJob) {
  const ticketRepo = new TicketRepository();
  const embeddingsProvider = await getEmbeddingsProvider();
  
  job.status = 'processing';
  
  const rows = await parseCSV(csvBuffer);
  job.total = rows.length;
  
  const batches = [];
  for (let i = 0; i < rows.length; i += BATCH_SIZE) {
    batches.push(rows.slice(i, i + BATCH_SIZE));
  }
  
  for (const batch of batches) {
    const tickets: Omit<Ticket, '_id'>[] = [];
    
    for (const row of batch) {
      const ticket: Omit<Ticket, '_id'> = {
        subject: row.subject || row.title || 'No subject',
        body: row.body || row.description || row.content || '',
        tags: parseTags(row.tags || row.category || ''),
        createdAt: parseDate(row.created_at || row.date) || new Date(),
      };
      
      if (ticket.body) {
        try {
          const embedding = await embeddingsProvider.embed(
            `${ticket.subject} ${ticket.body}`
          );
          ticket.embedding = embedding;
        } catch (err) {
          logger.warn('Failed to embed ticket', { subject: ticket.subject });
        }
      }
      
      tickets.push(ticket);
      job.processed++;
    }
    
    await ticketRepo.createMany(tickets);
    job.batchesDone++;
  }
  
  job.status = 'completed';
}

function parseCSV(csvBuffer: Buffer): Promise<any[]> {
  return new Promise((resolve, reject) => {
    const rows: any[] = [];
    const stream = Readable.from(csvBuffer);
    
    stream
      .pipe(csv())
      .on('data', (row) => rows.push(row))
      .on('end', () => resolve(rows))
      .on('error', reject);
  });
}

function parseTags(input: string): string[] {
  if (!input) return [];
  
  return input
    .split(/[,;|]/)
    .map(tag => tag.trim())
    .filter(tag => tag.length > 0)
    .slice(0, 5);
}

function parseDate(input: string | undefined): Date | null {
  if (!input) return null;
  
  const date = new Date(input);
  return isNaN(date.getTime()) ? null : date;
}