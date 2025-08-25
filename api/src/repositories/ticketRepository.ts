import { ObjectId } from 'mongodb';
import { Ticket } from '../models/types';
import { getDb } from '../db/connection';

export class TicketRepository {
  private get collection() {
    return getDb().collection<Ticket>('tickets');
  }

  async createMany(tickets: Omit<Ticket, '_id'>[]): Promise<void> {
    if (tickets.length === 0) return;
    await this.collection.insertMany(tickets);
  }

  async findAll(limit: number = 100): Promise<Ticket[]> {
    return this.collection
      .find({})
      .sort({ createdAt: -1 })
      .limit(limit)
      .toArray();
  }

  async search(query: string): Promise<Ticket[]> {
    return this.collection
      .find({ $text: { $search: query } })
      .limit(20)
      .toArray();
  }

  async findByTags(tags: string[]): Promise<Ticket[]> {
    return this.collection
      .find({ tags: { $in: tags } })
      .limit(50)
      .toArray();
  }

  async count(): Promise<number> {
    return this.collection.countDocuments();
  }
}