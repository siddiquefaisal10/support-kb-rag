import { MongoClient, Db } from 'mongodb';
import { config } from '../config/env';
import { logger } from '../utils/logger';

let client: MongoClient | null = null;
let db: Db | null = null;

export async function connectToDatabase(): Promise<Db> {
  if (db) return db;

  try {
    client = new MongoClient(config.mongoUri);
    await client.connect();
    db = client.db();
    
    await createIndexes(db);
    
    logger.info('Connected to MongoDB');
    return db;
  } catch (error) {
    logger.error('Failed to connect to MongoDB', error);
    throw error;
  }
}

async function createIndexes(db: Db) {
  await db.collection('chunks').createIndex({ docId: 1 });
  await db.collection('chunks').createIndex({ 'meta.file': 1 });
  await db.collection('tickets').createIndex({ createdAt: -1 });
  await db.collection('tickets').createIndex({ tags: 1 });
  await db.collection('documents').createIndex({ status: 1 });
  await db.collection('documents').createIndex({ createdAt: -1 });
  
  await db.collection('tickets').createIndex(
    { subject: 'text', body: 'text' },
    { name: 'text_search' }
  );
}

export async function closeDatabase() {
  if (client) {
    await client.close();
    client = null;
    db = null;
  }
}

export function getDb(): Db {
  if (!db) {
    throw new Error('Database not connected');
  }
  return db;
}