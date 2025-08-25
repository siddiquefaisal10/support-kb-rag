import { GoogleGenerativeAI } from '@google/generative-ai';
import { EmbeddingsProvider, ChatProvider, ChatMessage } from './types';
import { config } from '../config/env';
import { logger } from '../utils/logger';

export class GeminiEmbeddingsProvider implements EmbeddingsProvider {
  name = 'gemini';
  private client: GoogleGenerativeAI | null = null;

  constructor() {
    if (config.gemini.apiKey) {
      this.client = new GoogleGenerativeAI(config.gemini.apiKey);
    }
  }

  async isAvailable(): Promise<boolean> {
    if (!this.client) {
      logger.warn('Gemini embeddings client not initialized', { apiKey: config.gemini.apiKey ? 'present' : 'missing' });
      return false;
    }
    
    try {
      const model = this.client.getGenerativeModel({ model: 'text-embedding-004' });
      const result = await model.embedContent('test');
      logger.info('Gemini embeddings provider available', { embeddingSize: result.embedding.values.length });
      return true;
    } catch (error: any) {
      logger.warn('Gemini embeddings provider not available', { 
        error: error.message, 
        stack: error.stack,
        model: 'text-embedding-004'
      });
      return false;
    }
  }

  async embed(text: string): Promise<number[]> {
    if (!this.client) throw new Error('Gemini client not initialized');
    
    const model = this.client.getGenerativeModel({ model: 'text-embedding-004' });
    const result = await model.embedContent(text);
    return result.embedding.values;
  }

  async embedBatch(texts: string[]): Promise<number[][]> {
    return Promise.all(texts.map(text => this.embed(text)));
  }
}

export class GeminiChatProvider implements ChatProvider {
  name = 'gemini';
  private client: GoogleGenerativeAI | null = null;

  constructor() {
    if (config.gemini.apiKey) {
      this.client = new GoogleGenerativeAI(config.gemini.apiKey);
    }
  }

  async isAvailable(): Promise<boolean> {
    if (!this.client) {
      logger.warn('Gemini chat client not initialized', { apiKey: config.gemini.apiKey ? 'present' : 'missing' });
      return false;
    }
    
    try {
      const model = this.client.getGenerativeModel({ model: config.gemini.chatModel });
      const result = await model.generateContent('Hello');
      logger.info('Gemini chat provider available', { 
        model: config.gemini.chatModel,
        responseLength: result.response.text().length
      });
      return true;
    } catch (error: any) {
      const isQuotaExceeded = error.message?.includes('quota') || 
                             error.message?.includes('RESOURCE_EXHAUSTED') ||
                             error.status === 429;
      
      logger.warn('Gemini chat provider not available', { 
        error: error.message, 
        model: config.gemini.chatModel,
        quotaExceeded: isQuotaExceeded
      });
      return false;
    }
  }

  async chat(
    messages: ChatMessage[],
    onToken?: (token: string) => void
  ): Promise<string> {
    if (!this.client) throw new Error('Gemini client not initialized');
    
    try {
      const model = this.client.getGenerativeModel({ model: config.gemini.chatModel });
      
      const systemMessage = messages.find(m => m.role === 'system')?.content || '';
      const userMessages = messages.filter(m => m.role === 'user' || m.role === 'assistant');
      
      const history = userMessages.slice(0, -1).map(msg => ({
        role: msg.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: msg.content }],
      }));
      
      const chat = model.startChat({
        history,
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 1024,
        },
      });
      
      const lastMessage = messages[messages.length - 1];
      const prompt = systemMessage ? `${systemMessage}\n\n${lastMessage.content}` : lastMessage.content;
      
      if (onToken) {
        const result = await chat.sendMessageStream(prompt);
        let fullResponse = '';
        
        for await (const chunk of result.stream) {
          const chunkText = chunk.text();
          fullResponse += chunkText;
          onToken(chunkText);
        }
        
        return fullResponse;
      } else {
        const result = await chat.sendMessage(prompt);
        return result.response.text();
      }
    } catch (error: any) {
      const isQuotaExceeded = error.message?.includes('quota') || 
                             error.message?.includes('RESOURCE_EXHAUSTED') ||
                             error.status === 429;
      
      if (isQuotaExceeded) {
        throw new Error('QUOTA_EXCEEDED: Gemini API quota limit reached. Please try again tomorrow or upgrade your plan.');
      }
      
      throw error;
    }
  }
}