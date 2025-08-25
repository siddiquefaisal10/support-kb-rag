import { ObjectId } from 'mongodb';
import pdf from 'pdf-parse';
import { v4 as uuidv4 } from 'uuid';
import { DocumentRepository } from '../repositories/documentRepository';
import { ChunkRepository } from '../repositories/chunkRepository';
import { getEmbeddingsProvider } from '../providers/factory';
import { chunkText, chunkMarkdown } from './chunking';
import { logger } from '../utils/logger';
import { Document, Chunk } from '../models/types';

interface UploadJob {
  jobId: string;
  files: Array<{
    fileId: string;
    filename: string;
    buffer: Buffer;
    type: 'pdf' | 'md';
  }>;
  status: Map<string, FileStatus>;
}

interface FileStatus {
  fileId: string;
  filename: string;
  stages: {
    uploaded: boolean;
    extracted: boolean;
    chunked: boolean;
    indexed: boolean;
  };
  error?: string;
}

const jobs = new Map<string, UploadJob>();

export async function createUploadJob(
  files: Array<{ filename: string; buffer: Buffer }>
): Promise<string> {
  const jobId = uuidv4();
  const job: UploadJob = {
    jobId,
    files: files.map(f => ({
      fileId: uuidv4(),
      filename: f.filename,
      buffer: f.buffer,
      type: f.filename.endsWith('.pdf') ? 'pdf' : 'md',
    })),
    status: new Map(),
  };
  
  for (const file of job.files) {
    job.status.set(file.fileId, {
      fileId: file.fileId,
      filename: file.filename,
      stages: {
        uploaded: true,
        extracted: false,
        chunked: false,
        indexed: false,
      },
    });
  }
  
  jobs.set(jobId, job);
  
  processUploadJob(job).catch(err => {
    logger.error('Upload job failed', { jobId, error: err.message });
  });
  
  return jobId;
}

export function getJobStatus(jobId: string): FileStatus[] | null {
  const job = jobs.get(jobId);
  if (!job) return null;
  
  return Array.from(job.status.values());
}

async function processUploadJob(job: UploadJob) {
  const docRepo = new DocumentRepository();
  const chunkRepo = new ChunkRepository();
  const embeddingsProvider = await getEmbeddingsProvider();
  
  for (const file of job.files) {
    const status = job.status.get(file.fileId)!;
    
    try {
      const doc = await docRepo.create({
        title: file.filename,
        type: file.type,
        status: 'uploaded',
        createdAt: new Date(),
      });
      
      let content: string;
      
      if (file.type === 'pdf') {
        const pdfData = await pdf(file.buffer);
        content = pdfData.text;
      } else {
        content = file.buffer.toString('utf-8');
      }
      
      await docRepo.updateContent(doc._id!, content);
      await docRepo.updateStatus(doc._id!, 'extracted');
      status.stages.extracted = true;
      
      const chunks: Omit<Chunk, '_id'>[] = [];
      
      if (file.type === 'md') {
        const mdChunks = chunkMarkdown(content);
        mdChunks.forEach((chunk, index) => {
          chunks.push({
            docId: doc._id!,
            text: chunk.text,
            meta: {
              file: file.filename,
              anchor: chunk.anchor,
              index,
            },
          });
        });
      } else {
        const pages = content.split('\f');
        pages.forEach((page, pageNum) => {
          const pageChunks = chunkText(page);
          pageChunks.forEach((chunk, index) => {
            chunks.push({
              docId: doc._id!,
              text: chunk,
              meta: {
                file: file.filename,
                page: pageNum + 1,
                index,
              },
            });
          });
        });
      }
      
      await chunkRepo.createMany(chunks);
      await docRepo.updateStatus(doc._id!, 'chunked');
      status.stages.chunked = true;
      
      const savedChunks = await chunkRepo.findByDocId(doc._id!);
      const embeddings = await embeddingsProvider.embedBatch(
        savedChunks.map(c => c.text)
      );
      
      for (let i = 0; i < savedChunks.length; i++) {
        await chunkRepo.updateEmbedding(savedChunks[i]._id!, embeddings[i]);
      }
      
      await docRepo.updateStatus(doc._id!, 'indexed');
      status.stages.indexed = true;
      
    } catch (error: any) {
      logger.error('File processing failed', {
        fileId: file.fileId,
        filename: file.filename,
        error: error.message,
      });
      status.error = error.message;
    }
  }
}