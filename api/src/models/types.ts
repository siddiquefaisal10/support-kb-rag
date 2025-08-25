import { ObjectId } from 'mongodb';

export interface Document {
  _id?: ObjectId;
  title: string;
  type: 'pdf' | 'md';
  status: 'uploaded' | 'extracted' | 'chunked' | 'indexed' | 'failed';
  createdAt: Date;
  error?: string;
  content?: string;
}

export interface Chunk {
  _id?: ObjectId;
  docId: ObjectId;
  text: string;
  embedding?: number[];
  meta: {
    file: string;
    page?: number;
    anchor?: string;
    index?: number;
    start?: number;
    end?: number;
  };
}

export interface Ticket {
  _id?: ObjectId;
  subject: string;
  body: string;
  tags: string[];
  createdAt: Date;
  embedding?: number[];
}

export interface EvalCase {
  q: string;
  a: string;
  pred?: string;
  correct?: boolean;
}

export interface EvalRun {
  _id?: ObjectId;
  name: string;
  cases: EvalCase[];
  accuracy: number;
  accuracyContains?: number;
  latency: {
    p50: number;
    p95: number;
  };
  createdAt: Date;
}

export interface JobStatus {
  jobId: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress?: number;
  total?: number;
  error?: string;
  createdAt: Date;
  updatedAt: Date;
}