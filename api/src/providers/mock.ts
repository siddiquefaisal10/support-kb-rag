import { EmbeddingsProvider, ChatProvider, ChatMessage } from './types';

export class MockEmbeddingsProvider implements EmbeddingsProvider {
  name = 'mock';

  async isAvailable(): Promise<boolean> {
    return true;
  }

  async embed(text: string): Promise<number[]> {
    const dim = 384;
    const embedding = new Array(dim);
    
    for (let i = 0; i < dim; i++) {
      const seed = text.charCodeAt(i % text.length) + i;
      embedding[i] = Math.sin(seed) * 0.5 + Math.cos(seed * 2) * 0.5;
    }
    
    const norm = Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0));
    return embedding.map(val => val / norm);
  }

  async embedBatch(texts: string[]): Promise<number[][]> {
    return Promise.all(texts.map(text => this.embed(text)));
  }
}

export class MockChatProvider implements ChatProvider {
  name = 'mock';

  async isAvailable(): Promise<boolean> {
    return true;
  }

  async chat(
    messages: ChatMessage[],
    onToken?: (token: string) => void
  ): Promise<string> {
    const lastMessage = messages[messages.length - 1];
    const response = `Based on the knowledge base, here's a helpful response to "${lastMessage.content}". 
    
    The system found relevant information in [KB:faq.md#general] and [KB:policies.pdf#page-3] that addresses your question.
    
    Key points:
    • This is a mock response for testing purposes
    • Real providers will generate actual responses
    • Citations are included inline like [KB:source#anchor]
    
    For more details, please refer to the documentation.`;

    if (onToken) {
      const tokens = response.split(' ');
      for (const token of tokens) {
        await new Promise(resolve => setTimeout(resolve, 10));
        onToken(token + ' ');
      }
    }

    return response;
  }
}