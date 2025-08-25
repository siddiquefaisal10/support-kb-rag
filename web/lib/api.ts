const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export interface FileStatus {
  fileId: string;
  filename: string;
  stages: {
    uploaded: boolean;
    extracted: boolean;
    chunked: boolean;
    indexed: boolean;
  };
  error?: string;
}

export interface Citation {
  id: string;
  source: string;
  text: string;
}

export interface Ticket {
  _id: string;
  subject: string;
  body: string;
  tags: string[];
  createdAt: string;
}

export interface EvalRun {
  _id: string;
  name: string;
  cases: Array<{
    q: string;
    a: string;
    pred?: string;
    correct?: boolean;
  }>;
  accuracy: number;
  accuracyContains?: number;
  latency: {
    p50: number;
    p95: number;
  };
  createdAt: string;
}

export class ApiClient {
  async uploadFiles(files: File[]): Promise<string> {
    const formData = new FormData();
    files.forEach(file => formData.append('files', file));
    
    const res = await fetch(`${API_BASE}/upload`, {
      method: 'POST',
      body: formData,
    });
    
    const data = await res.json();
    return data.jobId;
  }
  
  async getUploadStatus(jobId: string): Promise<FileStatus[]> {
    const res = await fetch(`${API_BASE}/upload/status?jobId=${jobId}`);
    return res.json();
  }
  
  async ingestCSV(file: File): Promise<string> {
    const formData = new FormData();
    formData.append('file', file);
    
    const res = await fetch(`${API_BASE}/tickets/ingest-csv`, {
      method: 'POST',
      body: formData,
    });
    
    const data = await res.json();
    return data.jobId;
  }
  
  async getIngestStatus(jobId: string): Promise<any> {
    const res = await fetch(`${API_BASE}/tickets/ingest/status?jobId=${jobId}`);
    return res.json();
  }
  
  async getTickets(): Promise<Ticket[]> {
    const res = await fetch(`${API_BASE}/tickets`);
    return res.json();
  }
  
  async searchTickets(query: string): Promise<Ticket[]> {
    const res = await fetch(`${API_BASE}/tickets/search?q=${encodeURIComponent(query)}`);
    return res.json();
  }
  
  async runEval(name: string, model?: string): Promise<EvalRun> {
    const res = await fetch(`${API_BASE}/eval/run`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, model }),
    });
    return res.json();
  }
  
  async getEvalRuns(): Promise<EvalRun[]> {
    const res = await fetch(`${API_BASE}/eval/runs`);
    return res.json();
  }
  
  async getProviderStatus(): Promise<any> {
    const res = await fetch(`${API_BASE}/providers/status`);
    return res.json();
  }
  
  streamChat(
    query: string,
    model: string,
    onToken: (token: string) => void,
    onCitations: (data: { citations: Citation[]; quotaExceeded?: boolean }) => void,
    onError: (error: string) => void
  ): () => void {
    const controller = new AbortController();
    
    fetch(`${API_BASE}/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, model }),
      signal: controller.signal,
    }).then(async response => {
      const reader = response.body?.getReader();
      if (!reader) return;
      
      const decoder = new TextDecoder();
      let buffer = '';
      
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        const chunk = decoder.decode(value, { stream: true });
        buffer += chunk;
        
        // Process complete SSE messages
        const messages = buffer.split('\n\n');
        buffer = messages.pop() || ''; // Keep incomplete message in buffer
        
        for (const message of messages) {
          if (!message.trim()) continue;
          
          const lines = message.split('\n');
          let event = '';
          let data = '';
          
          for (const line of lines) {
            if (line.startsWith('event: ')) {
              event = line.substring(7);
            } else if (line.startsWith('data: ')) {
              data = line.substring(6);
            } else if (line.startsWith(':')) {
              // Heartbeat, ignore
              continue;
            }
          }
          
          if (event && data) {
            try {
              const parsedData = JSON.parse(data);
              
              if (event === 'token') {
                onToken(parsedData.token);
              } else if (event === 'done') {
                console.log('Done event received:', parsedData);
                onCitations({
                  citations: parsedData.citations || [],
                  quotaExceeded: parsedData.quotaExceeded
                });
              } else if (event === 'error') {
                onError(parsedData.error);
              }
            } catch (e) {
              console.error('Failed to parse SSE data:', e, 'Data:', data);
            }
          }
        }
      }
    }).catch(err => {
      if (err.name !== 'AbortError') {
        onError(err.message);
      }
    });
    
    return () => controller.abort();
  }
}

export const api = new ApiClient();