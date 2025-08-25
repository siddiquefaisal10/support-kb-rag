import { ObjectId, Db } from 'mongodb';
import { Chunk } from '../models/types';
import { getDb } from '../db/connection';

export class ChunkRepository {
  private get collection() {
    return getDb().collection<Chunk>('chunks');
  }

  async createMany(chunks: Omit<Chunk, '_id'>[]): Promise<void> {
    if (chunks.length === 0) return;
    await this.collection.insertMany(chunks);
  }

  async findByDocId(docId: string | ObjectId): Promise<Chunk[]> {
    const id = typeof docId === 'string' ? new ObjectId(docId) : docId;
    return this.collection.find({ docId: id }).toArray();
  }

  async findSimilar(embedding: number[], limit: number = 5): Promise<Chunk[]> {
    const chunks = await this.collection.find({ embedding: { $exists: true } }).toArray();
    
    const scored = chunks.map(chunk => ({
      chunk,
      score: cosineSimilarity(embedding, chunk.embedding!),
    }));
    
    scored.sort((a, b) => b.score - a.score);
    
    return scored.slice(0, limit).map(s => s.chunk);
  }

  async updateEmbedding(id: string | ObjectId, embedding: number[]): Promise<void> {
    const _id = typeof id === 'string' ? new ObjectId(id) : id;
    await this.collection.updateOne({ _id }, { $set: { embedding } });
  }

  async deleteByDocId(docId: string | ObjectId): Promise<void> {
    const id = typeof docId === 'string' ? new ObjectId(docId) : docId;
    await this.collection.deleteMany({ docId: id });
  }
}

function cosineSimilarity(a: number[], b: number[]): number {
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  
  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}