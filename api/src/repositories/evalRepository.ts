import { ObjectId } from 'mongodb';
import { EvalRun } from '../models/types';
import { getDb } from '../db/connection';

export class EvalRepository {
  private get collection() {
    return getDb().collection<EvalRun>('evalRuns');
  }

  async create(evalRun: Omit<EvalRun, '_id'>): Promise<EvalRun> {
    const result = await this.collection.insertOne({
      ...evalRun,
      createdAt: new Date(),
    });
    return { ...evalRun, _id: result.insertedId, createdAt: new Date() };
  }

  async findAll(): Promise<EvalRun[]> {
    return this.collection.find({}).sort({ createdAt: -1 }).toArray();
  }

  async findById(id: string | ObjectId): Promise<EvalRun | null> {
    const _id = typeof id === 'string' ? new ObjectId(id) : id;
    return this.collection.findOne({ _id });
  }
}