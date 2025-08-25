import { ObjectId, Db } from 'mongodb';
import { Document } from '../models/types';
import { getDb } from '../db/connection';

export class DocumentRepository {
  private get collection() {
    return getDb().collection<Document>('documents');
  }

  async create(document: Omit<Document, '_id'>): Promise<Document> {
    const result = await this.collection.insertOne({
      ...document,
      createdAt: new Date(),
    });
    return { ...document, _id: result.insertedId };
  }

  async findById(id: string | ObjectId): Promise<Document | null> {
    const _id = typeof id === 'string' ? new ObjectId(id) : id;
    return this.collection.findOne({ _id });
  }

  async findAll(): Promise<Document[]> {
    return this.collection.find({}).sort({ createdAt: -1 }).toArray();
  }

  async updateStatus(
    id: string | ObjectId,
    status: Document['status'],
    error?: string
  ): Promise<void> {
    const _id = typeof id === 'string' ? new ObjectId(id) : id;
    const update: any = { status };
    if (error) update.error = error;
    
    await this.collection.updateOne({ _id }, { $set: update });
  }

  async updateContent(id: string | ObjectId, content: string): Promise<void> {
    const _id = typeof id === 'string' ? new ObjectId(id) : id;
    await this.collection.updateOne({ _id }, { $set: { content } });
  }
}