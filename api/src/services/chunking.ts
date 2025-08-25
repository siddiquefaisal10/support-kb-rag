export interface ChunkOptions {
  maxChunkSize: number;
  overlapSize: number;
}

export function chunkText(
  text: string,
  options: ChunkOptions = { maxChunkSize: 500, overlapSize: 50 }
): string[] {
  const { maxChunkSize, overlapSize } = options;
  const chunks: string[] = [];
  
  const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];
  let currentChunk = '';
  
  for (const sentence of sentences) {
    if (currentChunk.length + sentence.length > maxChunkSize && currentChunk.length > 0) {
      chunks.push(currentChunk.trim());
      
      const words = currentChunk.split(' ');
      const overlapWords = words.slice(-Math.floor(words.length * (overlapSize / maxChunkSize)));
      currentChunk = overlapWords.join(' ') + ' ' + sentence;
    } else {
      currentChunk += sentence;
    }
  }
  
  if (currentChunk.trim()) {
    chunks.push(currentChunk.trim());
  }
  
  return chunks;
}

export function chunkMarkdown(content: string): Array<{ text: string; anchor?: string }> {
  const chunks: Array<{ text: string; anchor?: string }> = [];
  const sections = content.split(/^#+\s+/m);
  
  for (let i = 0; i < sections.length; i++) {
    const section = sections[i].trim();
    if (!section) continue;
    
    const lines = section.split('\n');
    const headerMatch = lines[0]?.match(/^(.+?)$/);
    const anchor = headerMatch ? headerMatch[1].toLowerCase().replace(/\s+/g, '-') : undefined;
    
    const sectionChunks = chunkText(section);
    for (const chunk of sectionChunks) {
      chunks.push({ text: chunk, anchor });
    }
  }
  
  return chunks.length > 0 ? chunks : [{ text: content }];
}