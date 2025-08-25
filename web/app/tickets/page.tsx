'use client';

import { useState, useEffect } from 'react';
import { api, Ticket } from '@/lib/api';

export default function TicketsPage() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [ingestJobId, setIngestJobId] = useState<string | null>(null);
  const [ingestStatus, setIngestStatus] = useState<any>(null);
  const [isIngesting, setIsIngesting] = useState(false);

  useEffect(() => {
    loadTickets();
  }, []);

  useEffect(() => {
    if (!ingestJobId) return;

    const interval = setInterval(async () => {
      const status = await api.getIngestStatus(ingestJobId);
      setIngestStatus(status);
      
      if (status.status === 'completed' || status.status === 'failed') {
        clearInterval(interval);
        if (status.status === 'completed') {
          loadTickets();
        }
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [ingestJobId]);

  const loadTickets = async () => {
    const data = await api.getTickets();
    setTickets(data);
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      loadTickets();
      return;
    }
    
    const results = await api.searchTickets(searchQuery);
    setTickets(results);
  };

  const handleIngest = async () => {
    if (!csvFile) return;
    
    setIsIngesting(true);
    try {
      const jobId = await api.ingestCSV(csvFile);
      setIngestJobId(jobId);
    } catch (error) {
      console.error('Ingest failed:', error);
    } finally {
      setIsIngesting(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <h3 className="text-lg font-semibold mb-4">CSV Ingest</h3>
          <div className="space-y-4">
            <input
              type="file"
              accept=".csv"
              onChange={(e) => setCsvFile(e.target.files?.[0] || null)}
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
              disabled={isIngesting}
            />
            <button
              onClick={handleIngest}
              disabled={!csvFile || isIngesting}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isIngesting ? 'Processing...' : 'Ingest CSV'}
            </button>
            
            {ingestStatus && (
              <div className="bg-gray-50 rounded-lg p-3">
                <div className="text-sm">
                  Status: <span className="font-medium">{ingestStatus.status}</span>
                </div>
                {ingestStatus.total > 0 && (
                  <div className="text-sm mt-1">
                    Progress: {ingestStatus.processed} / {ingestStatus.total}
                  </div>
                )}
                {ingestStatus.error && (
                  <div className="text-sm text-red-600 mt-1">
                    Error: {ingestStatus.error}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <h3 className="text-lg font-semibold mb-4">Search Tickets</h3>
          <div className="flex gap-2">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              placeholder="Search tickets..."
              className="flex-1 px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={handleSearch}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Search
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-4 border-b">
          <h2 className="text-lg font-semibold">Tickets ({tickets.length})</h2>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Subject
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tags
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Created
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {tickets.map((ticket) => (
                <tr key={ticket._id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {ticket.subject}
                      </div>
                      <div className="text-sm text-gray-500 truncate max-w-md">
                        {ticket.body}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {ticket.tags.map((tag, idx) => (
                        <span
                          key={idx}
                          className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500">
                    {new Date(ticket.createdAt).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {tickets.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No tickets found
            </div>
          )}
        </div>
      </div>
    </div>
  );
}