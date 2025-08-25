'use client';

import { useState, useEffect } from 'react';
import { api, EvalRun } from '@/lib/api';

export default function EvalPage() {
  const [evalRuns, setEvalRuns] = useState<EvalRun[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [evalName, setEvalName] = useState('');
  const [model, setModel] = useState('mock');

  useEffect(() => {
    loadEvalRuns();
    
    const saved = localStorage.getItem('selectedModel');
    if (saved) setModel(saved);

    const handleModelChange = (e: CustomEvent) => {
      setModel(e.detail);
    };

    window.addEventListener('modelChanged' as any, handleModelChange);
    return () => window.removeEventListener('modelChanged' as any, handleModelChange);
  }, []);

  const loadEvalRuns = async () => {
    const runs = await api.getEvalRuns();
    setEvalRuns(runs);
  };

  const handleRunEval = async () => {
    setIsRunning(true);
    try {
      await api.runEval(evalName || `Eval ${new Date().toLocaleString()}`, model);
      await loadEvalRuns();
    } catch (error) {
      console.error('Eval failed:', error);
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
        <div className="p-4 border-b">
          <h2 className="text-lg font-semibold">Run Evaluation</h2>
        </div>
        
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <input
              type="text"
              value={evalName}
              onChange={(e) => setEvalName(e.target.value)}
              placeholder="Evaluation name (optional)"
              className="px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <select
              value={model}
              onChange={(e) => setModel(e.target.value)}
              className="px-3 py-2 border rounded-md"
            >
              <option value="mock">Mock</option>
              <option value="groq">Groq</option>
              <option value="gemini">Gemini</option>
            </select>
            <button
              onClick={handleRunEval}
              disabled={isRunning}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isRunning ? 'Running...' : 'Run Evaluation'}
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-4 border-b">
          <h2 className="text-lg font-semibold">Evaluation History</h2>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Name
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Accuracy
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Contains Accuracy
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Latency (p50/p95)
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Cases
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {evalRuns.map((run) => (
                <tr key={run._id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">
                    {run.name}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                      run.accuracy >= 0.8 ? 'bg-green-100 text-green-800' :
                      run.accuracy >= 0.5 ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {(run.accuracy * 100).toFixed(1)}%
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm">
                    {run.accuracyContains !== undefined && (
                      <span className="text-gray-600">
                        {(run.accuracyContains * 100).toFixed(1)}%
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {run.latency.p50}ms / {run.latency.p95}ms
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <details className="cursor-pointer">
                      <summary className="text-blue-600 hover:underline">
                        {run.cases.length} cases
                      </summary>
                      <div className="mt-2 space-y-2 max-h-60 overflow-y-auto">
                        {run.cases.map((c, idx) => (
                          <div key={idx} className="bg-gray-50 rounded p-2 text-xs">
                            <div className="font-medium">Q: {c.q}</div>
                            <div className="text-gray-600">Expected: {c.a}</div>
                            {c.pred && (
                              <div className="text-gray-700">Got: {c.pred.substring(0, 100)}...</div>
                            )}
                            <div className={c.correct ? 'text-green-600' : 'text-red-600'}>
                              {c.correct ? '✓' : '✗'}
                            </div>
                          </div>
                        ))}
                      </div>
                    </details>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500">
                    {new Date(run.createdAt).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {evalRuns.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No evaluation runs yet
            </div>
          )}
        </div>
      </div>
    </div>
  );
}