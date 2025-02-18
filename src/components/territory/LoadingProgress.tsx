import React from 'react';
import { Loader2 } from 'lucide-react';

interface LoadingProgressProps {
  processedAccounts: number;
  totalAccounts: number;
  loadingProgress: number;
}

function LoadingProgress({ processedAccounts, totalAccounts, loadingProgress }: LoadingProgressProps) {
  return (
    <div className="mb-4 bg-white p-4 rounded-lg shadow-sm border border-gray-200">
      <div className="flex items-center gap-3 mb-2">
        <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />
        <span className="text-sm font-medium text-gray-700">
          Processing accounts: {processedAccounts} of {totalAccounts}
        </span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2.5">
        <div
          className="bg-blue-500 h-2.5 rounded-full transition-all duration-300"
          style={{ width: `${loadingProgress}%` }}
        />
      </div>
    </div>
  );
}

export default LoadingProgress;