'use client';

import { useState, useEffect } from 'react';
import { api, FileStatus } from '@/lib/api';

export default function UploadPage() {
  const [files, setFiles] = useState<File[]>([]);
  const [jobId, setJobId] = useState<string | null>(null);
  const [statuses, setStatuses] = useState<FileStatus[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    if (!jobId) return;

    const interval = setInterval(async () => {
      const newStatuses = await api.getUploadStatus(jobId);
      setStatuses(newStatuses);
      
      const allDone = newStatuses.every(s => 
        s.stages.indexed || s.error
      );
      
      if (allDone) {
        clearInterval(interval);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [jobId]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = Array.from(e.target.files || []);
    setFiles(fileList);
  };

  const handleUpload = async () => {
    if (files.length === 0) return;
    
    setIsUploading(true);
    try {
      const newJobId = await api.uploadFiles(files);
      setJobId(newJobId);
    } catch (error) {
      console.error('Upload failed:', error);
    } finally {
      setIsUploading(false);
    }
  };

  const getStageStatus = (stages: FileStatus['stages']) => {
    if (stages.indexed) return 'Indexed ✓';
    if (stages.chunked) return 'Chunking...';
    if (stages.extracted) return 'Extracted';
    if (stages.uploaded) return 'Uploaded';
    return 'Pending';
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-4 border-b">
          <h2 className="text-lg font-semibold">Upload & Index Documents</h2>
        </div>
        
        <div className="p-6">
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">
              Select PDF or Markdown files
            </label>
            <input
              type="file"
              multiple
              accept=".pdf,.md"
              onChange={handleFileChange}
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
              disabled={isUploading}
            />
          </div>

          {files.length > 0 && (
            <div className="mb-4">
              <div className="text-sm font-medium mb-2">Selected files:</div>
              <ul className="text-sm text-gray-600 space-y-1">
                {files.map((file, idx) => (
                  <li key={idx}>• {file.name}</li>
                ))}
              </ul>
            </div>
          )}

          <button
            onClick={handleUpload}
            disabled={files.length === 0 || isUploading}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isUploading ? 'Uploading...' : 'Upload & Index'}
          </button>

          {statuses.length > 0 && (
            <div className="mt-6">
              <div className="text-sm font-medium mb-2">Progress:</div>
              <div className="space-y-2">
                {statuses.map((status) => (
                  <div key={status.fileId} className="bg-gray-50 rounded-lg p-3">
                    <div className="flex justify-between items-center">
                      <div className="text-sm font-medium">{status.filename}</div>
                      <div className="text-sm text-gray-600">
                        {status.error ? (
                          <span className="text-red-600">Error: {status.error}</span>
                        ) : (
                          getStageStatus(status.stages)
                        )}
                      </div>
                    </div>
                    <div className="mt-2 flex gap-2">
                      {Object.entries(status.stages).map(([stage, completed]) => (
                        <div
                          key={stage}
                          className={`text-xs px-2 py-1 rounded ${
                            completed ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                          }`}
                        >
                          {stage}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}