'use client';

import { useEffect } from 'react';

interface QuotaExceededModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSwitchToMock: () => void;
}

export default function QuotaExceededModal({ 
  isOpen, 
  onClose, 
  onSwitchToMock 
}: QuotaExceededModalProps) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleOk = () => {
    onSwitchToMock();
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-md w-full p-6 shadow-xl">
        <div className="flex items-center mb-4">
          <div className="flex-shrink-0">
            <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center">
              <svg 
                className="w-6 h-6 text-yellow-600" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" 
                />
              </svg>
            </div>
          </div>
          <div className="ml-4">
            <h3 className="text-lg font-semibold text-gray-900">
              API Quota Exceeded
            </h3>
          </div>
        </div>

        <div className="mb-6">
          <p className="text-gray-600 text-sm leading-relaxed">
            The Gemini AI provider has reached its daily quota limit. The system will automatically 
            switch to the Mock provider to ensure continued functionality.
          </p>
          <div className="mt-3 p-3 bg-blue-50 rounded-md">
            <p className="text-blue-800 text-xs">
              <strong>Note:</strong> You can try again tomorrow when the quota resets, or consider upgrading 
              to a paid plan for higher limits.
            </p>
          </div>
        </div>

        <div className="flex justify-end space-x-3">
          <button
            onClick={handleOk}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
          >
            OK, Switch to Mock
          </button>
        </div>
      </div>
    </div>
  );
}