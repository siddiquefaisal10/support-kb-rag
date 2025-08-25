import { EmbeddingsProvider, ChatProvider, ProviderType } from './types';
import { MockEmbeddingsProvider, MockChatProvider } from './mock';
import { GeminiEmbeddingsProvider, GeminiChatProvider } from './gemini';
import { GroqEmbeddingsProvider, GroqChatProvider } from './groq';
import { config } from '../config/env';
import { logger } from '../utils/logger';

const embeddingsProviders: Map<ProviderType, EmbeddingsProvider> = new Map([
  ['mock', new MockEmbeddingsProvider()],
  ['gemini', new GeminiEmbeddingsProvider()],
  ['groq', new GroqEmbeddingsProvider()],
]);

const chatProviders: Map<ProviderType, ChatProvider> = new Map([
  ['mock', new MockChatProvider()],
  ['gemini', new GeminiChatProvider()],
  ['groq', new GroqChatProvider()],
]);

export async function getEmbeddingsProvider(
  providerType?: ProviderType
): Promise<EmbeddingsProvider> {
  const type = providerType || (config.models.default as ProviderType);
  
  if (!config.models.enabled.includes(type)) {
    logger.warn(`Provider ${type} not enabled, falling back to mock`);
    return embeddingsProviders.get('mock')!;
  }
  
  const provider = embeddingsProviders.get(type);
  if (!provider) {
    logger.warn(`Provider ${type} not found, falling back to mock`);
    return embeddingsProviders.get('mock')!;
  }
  
  const isAvailable = await provider.isAvailable();
  if (!isAvailable) {
    logger.warn(`Provider ${type} not available, falling back to mock`);
    return embeddingsProviders.get('mock')!;
  }
  
  return provider;
}

export async function getChatProvider(
  providerType?: ProviderType
): Promise<ChatProvider> {
  const type = providerType || (config.models.default as ProviderType);
  
  if (!config.models.enabled.includes(type)) {
    logger.warn(`Provider ${type} not enabled, falling back to mock`);
    return chatProviders.get('mock')!;
  }
  
  const provider = chatProviders.get(type);
  if (!provider) {
    logger.warn(`Provider ${type} not found, falling back to mock`);
    return chatProviders.get('mock')!;
  }
  
  const isAvailable = await provider.isAvailable();
  if (!isAvailable) {
    logger.warn(`Provider ${type} not available, falling back to mock`);
    return chatProviders.get('mock')!;
  }
  
  return provider;
}

export async function getProviderStatus(): Promise<Record<string, boolean>> {
  const status: Record<string, boolean> = {};
  
  for (const [type, provider] of embeddingsProviders) {
    if (config.models.enabled.includes(type)) {
      status[type] = await provider.isAvailable();
    }
  }
  
  return status;
}