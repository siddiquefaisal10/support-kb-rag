import { ChunkRepository } from '../repositories/chunkRepository';
import { getEmbeddingsProvider, getChatProvider } from '../providers/factory';
import { ChatMessage, ProviderType } from '../providers/types';
import { logger } from '../utils/logger';
import { Chunk } from '../models/types';

export interface Citation {
  id: string;
  source: string;
  text: string;
}

export interface RAGResponse {
  answer: string;
  citations: Citation[];
}

export async function performRAGQuery(
  query: string,
  providerType?: ProviderType,
  onToken?: (token: string) => void
): Promise<RAGResponse & { quotaExceeded?: boolean }> {
  const chunkRepo = new ChunkRepository();
  const embeddingsProvider = await getEmbeddingsProvider(providerType);
  
  // If the user requested Gemini specifically, try it first before falling back
  if (providerType === 'gemini') {
    try {
      const { GeminiChatProvider } = await import('../providers/gemini');
      const directChatProvider = new GeminiChatProvider();
      
      const queryEmbedding = await embeddingsProvider.embed(query);
      const relevantChunks = await chunkRepo.findSimilar(queryEmbedding, 5);
      
      if (relevantChunks.length === 0) {
        return {
          answer: "I couldn't find any relevant information in the knowledge base for your query.",
          citations: [],
        };
      }
      
      const context = buildContext(relevantChunks);
      const citations = extractCitations(relevantChunks);
      
      const systemPrompt = `You are a helpful support agent. Use the following context from the knowledge base to answer the user's question.
Include inline citations in the format [KB:filename#anchor] or [KB:filename#page-N] where relevant.
If the information is not in the context, say so clearly.

Context:
${context}`;
      
      const messages: ChatMessage[] = [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: query },
      ];
      
      const answer = await directChatProvider.chat(messages, onToken);
      
      return {
        answer,
        citations,
      };
    } catch (error: any) {
      if (error.message?.startsWith('QUOTA_EXCEEDED:')) {
        return {
          answer: "I apologize, but the Gemini API has reached its quota limit. The system will automatically switch to a backup provider for your next request.",
          citations: [],
          quotaExceeded: true,
        };
      }
      // Fall through to regular provider system
    }
  }
  
  // Use regular provider system (which will likely fall back to mock)
  const chatProvider = await getChatProvider(providerType);
  
  const queryEmbedding = await embeddingsProvider.embed(query);
  const relevantChunks = await chunkRepo.findSimilar(queryEmbedding, 5);
  
  if (relevantChunks.length === 0) {
    return {
      answer: "I couldn't find any relevant information in the knowledge base for your query.",
      citations: [],
    };
  }
  
  const context = buildContext(relevantChunks);
  const citations = extractCitations(relevantChunks);
  
  const systemPrompt = `You are a helpful support agent. Use the following context from the knowledge base to answer the user's question.
Include inline citations in the format [KB:filename#anchor] or [KB:filename#page-N] where relevant.
If the information is not in the context, say so clearly.

Context:
${context}`;
  
  const messages: ChatMessage[] = [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: query },
  ];
  
  const answer = await chatProvider.chat(messages, onToken);
  
  return {
    answer,
    citations,
  };
}

function buildContext(chunks: Chunk[]): string {
  return chunks
    .map((chunk, idx) => {
      const ref = chunk.meta.anchor 
        ? `${chunk.meta.file}#${chunk.meta.anchor}`
        : chunk.meta.page
        ? `${chunk.meta.file}#page-${chunk.meta.page}`
        : chunk.meta.file;
      
      return `[Source ${idx + 1}: ${ref}]
${chunk.text}`;
    })
    .join('\n\n');
}

function extractCitations(chunks: Chunk[]): Citation[] {
  const citations: Citation[] = [];
  const seen = new Set<string>();
  
  for (const chunk of chunks) {
    const source = chunk.meta.anchor 
      ? `${chunk.meta.file}#${chunk.meta.anchor}`
      : chunk.meta.page
      ? `${chunk.meta.file}#page-${chunk.meta.page}`
      : chunk.meta.file;
    
    const id = `KB:${source}`;
    
    if (!seen.has(id) && citations.length < 5) {
      seen.add(id);
      citations.push({
        id,
        source,
        text: chunk.text.substring(0, 200) + (chunk.text.length > 200 ? '...' : ''),
      });
    }
  }
  
  return citations;
}