import { Request, Response, NextFunction } from 'express';
import { register, Counter, Histogram } from 'prom-client';

const httpRequestsTotal = new Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status', 'model'],
});

const httpRequestDuration = new Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status', 'model'],
  buckets: [0.1, 0.5, 1, 2, 5, 10],
});

register.registerMetric(httpRequestsTotal);
register.registerMetric(httpRequestDuration);

export function metricsMiddleware(req: Request, res: Response, next: NextFunction) {
  const start = Date.now();
  
  const originalEnd = res.end;
  res.end = function(...args: any[]) {
    const duration = (Date.now() - start) / 1000;
    const route = req.route?.path || req.path || 'unknown';
    const model = req.body?.model || req.headers['x-model'] || 'default';
    
    httpRequestsTotal.inc({
      method: req.method,
      route,
      status: res.statusCode.toString(),
      model,
    });
    
    httpRequestDuration.observe(
      {
        method: req.method,
        route,
        status: res.statusCode.toString(),
        model,
      },
      duration
    );
    
    originalEnd.apply(res, args as any);
  } as any;
  
  next();
}

export async function getMetrics(): Promise<string> {
  return await register.metrics();
}