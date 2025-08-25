'use client';

import { useState, useEffect, useRef } from 'react';
import { api, Citation } from '@/lib/api';
import QuotaExceededModal from '@/components/QuotaExceededModal';

export default function ChatPage() {
  const [query, setQuery] = useState('');
  const [messages, setMessages] = useState<Array<{
    role: 'user' | 'assistant';
    content: string;
    citations?: Citation[];
  }>>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [selectedCitation, setSelectedCitation] = useState<Citation | null>(null);
  const [model, setModel] = useState('mock');
  const [showQuotaModal, setShowQuotaModal] = useState(false);
  const abortRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem('selectedModel');
    if (saved) setModel(saved);

    const handleModelChange = (e: CustomEvent) => {
      setModel(e.detail);
    };

    window.addEventListener('modelChanged' as any, handleModelChange);
    return () => window.removeEventListener('modelChanged' as any, handleModelChange);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim() || isStreaming) return;

    const userMessage = query;
    setQuery('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsStreaming(true);

    let assistantMessage = '';
    const messageIndex = messages.length + 1;

    abortRef.current = api.streamChat(
      userMessage,
      model,
      (token) => {
        assistantMessage += token;
        setMessages(prev => {
          const newMessages = [...prev];
          if (newMessages[messageIndex]) {
            newMessages[messageIndex].content = assistantMessage;
          } else {
            newMessages[messageIndex] = { role: 'assistant', content: assistantMessage };
          }
          return newMessages;
        });
      },
      (data) => {
        setMessages(prev => {
          const newMessages = [...prev];
          if (newMessages[messageIndex]) {
            newMessages[messageIndex].citations = data.citations;
          }
          return newMessages;
        });
        
        if (data.quotaExceeded) {
          console.log('Quota exceeded detected, showing modal');
          setShowQuotaModal(true);
        }
        
        setIsStreaming(false);
      },
      (error) => {
        setMessages(prev => [...prev, { 
          role: 'assistant', 
          content: `Error: ${error}` 
        }]);
        setIsStreaming(false);
      }
    );
  };

  const handleSwitchToMock = () => {
    setModel('mock');
    localStorage.setItem('selectedModel', 'mock');
    window.dispatchEvent(new CustomEvent('modelChanged', { detail: 'mock' }));
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
        <div className="p-4 border-b">
          <h2 className="text-lg font-semibold">RAG Chat</h2>
        </div>
        
        <div className="h-96 overflow-y-auto p-4 space-y-4">
          {messages.map((msg, idx) => (
            <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-3xl ${msg.role === 'user' ? 'bg-blue-50' : 'bg-gray-50'} rounded-lg p-3`}>
                <div className="text-sm font-medium mb-1">
                  {msg.role === 'user' ? 'You' : 'Assistant'}
                </div>
                <div className="text-sm whitespace-pre-wrap">{msg.content}</div>
                {msg.citations && msg.citations.length > 0 && (
                  <div className="mt-3 pt-3 border-t">
                    <div className="text-xs font-medium mb-2">Citations:</div>
                    <div className="space-y-1">
                      {msg.citations.map((citation) => (
                        <button
                          key={citation.id}
                          onClick={() => setSelectedCitation(citation)}
                          className="block text-xs text-blue-600 hover:underline text-left"
                        >
                          {citation.id}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
          {isStreaming && (
            <div className="flex justify-start">
              <div className="bg-gray-50 rounded-lg p-3">
                <div className="text-sm">Streaming...</div>
              </div>
            </div>
          )}
        </div>
        
        <form onSubmit={handleSubmit} className="p-4 border-t">
          <div className="flex gap-2">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Ask a question..."
              className="flex-1 px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={isStreaming}
            />
            <button
              type="submit"
              disabled={isStreaming}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Send
            </button>
            {isStreaming && (
              <button
                type="button"
                onClick={() => abortRef.current?.()}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
              >
                Stop
              </button>
            )}
          </div>
        </form>
      </div>

      {selectedCitation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-96 overflow-y-auto p-6">
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-lg font-semibold">{selectedCitation.id}</h3>
              <button
                onClick={() => setSelectedCitation(null)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
            <div className="text-sm text-gray-600 mb-2">Source: {selectedCitation.source}</div>
            <div className="text-sm">{selectedCitation.text}</div>
          </div>
        </div>
      )}

      <QuotaExceededModal
        isOpen={showQuotaModal}
        onClose={() => setShowQuotaModal(false)}
        onSwitchToMock={handleSwitchToMock}
      />
    </div>
  );
}
