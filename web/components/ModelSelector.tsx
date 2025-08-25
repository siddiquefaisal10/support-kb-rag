'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';

export default function ModelSelector() {
  const [model, setModel] = useState('mock');
  const [providerStatus, setProviderStatus] = useState<any>(null);

  useEffect(() => {
    const saved = localStorage.getItem('selectedModel');
    if (saved) setModel(saved);
    
    api.getProviderStatus().then(setProviderStatus);

    // Listen for external model changes (like from quota modal)
    const handleModelChange = (e: CustomEvent) => {
      setModel(e.detail);
    };

    window.addEventListener('modelChanged' as any, handleModelChange);
    return () => window.removeEventListener('modelChanged' as any, handleModelChange);
  }, []);

  const handleChange = (newModel: string) => {
    setModel(newModel);
    localStorage.setItem('selectedModel', newModel);
    window.dispatchEvent(new CustomEvent('modelChanged', { detail: newModel }));
  };

  return (
    <div className="flex items-center gap-2">
      <label className="text-sm font-medium">Model:</label>
      <select
        value={model}
        onChange={(e) => handleChange(e.target.value)}
        className="px-3 py-1 border rounded-md text-sm"
      >
        <option value="mock">Mock</option>
        <option value="groq" disabled={!providerStatus?.status?.groq}>
          Groq {providerStatus?.status?.groq ? '✓' : '✗'}
        </option>
        <option value="gemini" disabled={!providerStatus?.status?.gemini}>
          Gemini {providerStatus?.status?.gemini ? '✓' : '✗'}
        </option>
      </select>
    </div>
  );
}