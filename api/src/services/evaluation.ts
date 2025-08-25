import { EvalRepository } from '../repositories/evalRepository';
import { performRAGQuery } from './ragService';
import { EvalCase, EvalRun } from '../models/types';
import { ProviderType } from '../providers/types';
import { logger } from '../utils/logger';

const defaultTestCases: Array<{ q: string; a: string }> = [
  {
    q: "What is your refund policy?",
    a: "refund within 30 days"
  },
  {
    q: "How do I reset my password?",
    a: "password reset link"
  },
  {
    q: "What payment methods do you accept?",
    a: "credit card, PayPal, bank transfer"
  },
  {
    q: "How can I contact support?",
    a: "support@example.com"
  },
  {
    q: "What are your business hours?",
    a: "Monday to Friday, 9 AM to 5 PM"
  },
  {
    q: "How do I track my order?",
    a: "tracking number"
  },
  {
    q: "Can I change my subscription plan?",
    a: "upgrade or downgrade"
  },
  {
    q: "What is the warranty period?",
    a: "one year warranty"
  }
];

export async function runEvaluation(
  name: string = 'Default Eval',
  providerType?: ProviderType,
  testCases: Array<{ q: string; a: string }> = defaultTestCases
): Promise<EvalRun> {
  const evalRepo = new EvalRepository();
  const cases: EvalCase[] = [];
  const latencies: number[] = [];
  
  for (const testCase of testCases) {
    const startTime = Date.now();
    
    try {
      const response = await performRAGQuery(testCase.q, providerType);
      const latency = Date.now() - startTime;
      latencies.push(latency);
      
      const pred = response.answer;
      const correctExact = pred.toLowerCase() === testCase.a.toLowerCase();
      const correctContains = testCase.a
        .toLowerCase()
        .split(/[,;]/)
        .map(s => s.trim())
        .some(term => pred.toLowerCase().includes(term));
      
      cases.push({
        q: testCase.q,
        a: testCase.a,
        pred,
        correct: correctExact || correctContains,
      });
    } catch (error: any) {
      logger.error('Eval case failed', { 
        question: testCase.q, 
        error: error.message 
      });
      
      cases.push({
        q: testCase.q,
        a: testCase.a,
        pred: 'ERROR: ' + error.message,
        correct: false,
      });
    }
  }
  
  const accuracy = cases.filter(c => c.correct).length / cases.length;
  const accuracyContains = cases.filter(c => {
    if (!c.pred || c.pred.startsWith('ERROR')) return false;
    return c.a
      .toLowerCase()
      .split(/[,;]/)
      .map(s => s.trim())
      .some(term => c.pred!.toLowerCase().includes(term));
  }).length / cases.length;
  
  latencies.sort((a, b) => a - b);
  const p50 = percentile(latencies, 0.5);
  const p95 = percentile(latencies, 0.95);
  
  const evalRun = await evalRepo.create({
    name,
    cases,
    accuracy,
    accuracyContains,
    latency: { p50, p95 },
    createdAt: new Date(),
  });
  
  return evalRun;
}

function percentile(arr: number[], p: number): number {
  if (arr.length === 0) return 0;
  
  const index = Math.ceil(arr.length * p) - 1;
  return arr[Math.max(0, Math.min(index, arr.length - 1))];
}