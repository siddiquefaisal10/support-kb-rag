import Groq from 'groq-sdk';
import { EmbeddingsProvider, ChatProvider, ChatMessage } from './types';
import { config } from '../config/env';
import { logger } from '../utils/logger';

export class GroqEmbeddingsProvider implements EmbeddingsProvider {
  name = 'groq';
  private client: Groq;

  constructor() {
    this.client = new Groq({
      apiKey: config.groq.apiKey,
    });
  }

  async isAvailable(): Promise<boolean> {
    try {
      // Test the connection with a simple completion
      await this.client.chat.completions.create({
        messages: [{ role: 'user', content: 'test' }],
        model: config.groq.chatModel,
        max_tokens: 1,
      });
      return true;
    } catch (error: any) {
      logger.warn('Groq embeddings provider error', { error: error.message });
      return false;
    }
  }

  async embed(text: string): Promise<number[]> {
    // Groq doesn't provide embeddings API, so we'll generate mock embeddings
    // In production, you'd want to use a different service for embeddings
    logger.warn('Groq does not provide embeddings API, using mock embeddings');
    const embedding = new Array(768).fill(0).map(() => Math.random() * 2 - 1);
    return embedding;
  }

  async embedBatch(texts: string[]): Promise<number[][]> {
    return Promise.all(texts.map(text => this.embed(text)));
  }
}

export class GroqChatProvider implements ChatProvider {
  name = 'groq';
  private client: Groq;

  constructor() {
    this.client = new Groq({
      apiKey: config.groq.apiKey,
    });
  }

  async isAvailable(): Promise<boolean> {
    try {
      // Test the connection with a simple completion
      await this.client.chat.completions.create({
        messages: [{ role: 'user', content: 'test' }],
        model: config.groq.chatModel,
        max_tokens: 1,
      });
      return true;
    } catch (error: any) {
      logger.warn('Groq chat provider error', { error: error.message });
      return false;
    }
  }

  async chat(
    messages: ChatMessage[],
    onToken?: (token: string) => void
  ): Promise<string> {
    try {
      const groqMessages = messages.map(m => ({
        role: m.role as 'system' | 'user' | 'assistant',
        content: m.content,
      }));

      logger.debug('Groq chat request', {
        messages: groqMessages.length,
        model: config.groq.chatModel,
      });

      if (onToken) {
        // Stream mode
        const stream = await this.client.chat.completions.create({
          messages: groqMessages,
          model: config.groq.chatModel,
          stream: true,
          temperature: 0.7,
          max_tokens: 2048,
        });

        let fullResponse = '';
        for await (const chunk of stream) {
          const content = chunk.choices[0]?.delta?.content || '';
          if (content) {
            fullResponse += content;
            onToken(content);
          }
        }
        return fullResponse;
      } else {
        // Non-stream mode
        const completion = await this.client.chat.completions.create({
          messages: groqMessages,
          model: config.groq.chatModel,
          temperature: 0.7,
          max_tokens: 2048,
        });

        return completion.choices[0]?.message?.content || '';
      }
    } catch (error: any) {
      logger.error('Groq chat error', { error: error.message });
      
      if (error.status === 429) {
        throw new Error('Groq rate limit exceeded. Please try again later or switch to a different model.');
      }
      
      throw new Error(`Groq chat failed: ${error.message}`);
    }
  }
}