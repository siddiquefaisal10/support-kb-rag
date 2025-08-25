export interface EmbeddingsProvider {
  name: string;
  isAvailable(): Promise<boolean>;
  embed(text: string): Promise<number[]>;
  embedBatch(texts: string[]): Promise<number[][]>;
}

export interface ChatProvider {
  name: string;
  isAvailable(): Promise<boolean>;
  chat(
    messages: ChatMessage[],
    onToken?: (token: string) => void
  ): Promise<string>;
}

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export type ProviderType = 'mock' | 'gemini' | 'groq';