import { Response } from 'express';

export class SSEStream {
  private res: Response;
  private heartbeatInterval: NodeJS.Timeout | null = null;

  constructor(res: Response) {
    this.res = res;
    
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no',
    });
    
    this.startHeartbeat();
  }

  private startHeartbeat() {
    this.heartbeatInterval = setInterval(() => {
      this.res.write(':heartbeat\n\n');
    }, 30000);
  }

  sendToken(token: string) {
    this.res.write(`event: token\ndata: ${JSON.stringify({ token })}\n\n`);
  }

  sendDone(data: any) {
    this.res.write(`event: done\ndata: ${JSON.stringify(data)}\n\n`);
  }

  sendError(error: string) {
    this.res.write(`event: error\ndata: ${JSON.stringify({ error })}\n\n`);
  }

  close() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
    }
    this.res.end();
  }
}