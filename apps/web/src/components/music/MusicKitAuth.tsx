'use client';

import { useState } from 'react';
import { useMusicKit } from '@/hooks/useMusicKit';

export function MusicKitAuth() {
  const { isConfigured, isAuthorized, isLoading, authorize, unauthorize } = useMusicKit();
  const [error, setError] = useState<string | null>(null);

  const handleAuthorize = async () => {
    setError(null);
    const success = await authorize();
    if (!success) {
      setError('Failed to connect Apple Music. Please try again.');
    }
  };

  if (!isConfigured) {
    return (
      <div className="p-4 bg-yellow-100 border border-yellow-400 text-yellow-700 rounded">
        MusicKit is not configured. Please check your developer token.
      </div>
    );
  }

  if (isAuthorized) {
    return (
      <div className="p-4 bg-green-100 border border-green-400 rounded">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-green-700 font-medium">Apple Music Connected</p>
            <p className="text-green-600 text-sm">
              You can now browse and add favorites.
            </p>
          </div>
          <button
            onClick={unauthorize}
            disabled={isLoading}
            className="text-green-700 hover:text-green-900 underline text-sm"
          >
            Disconnect
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow">
      <h2 className="text-lg font-semibold mb-2">Connect Apple Music</h2>
      <p className="text-gray-600 dark:text-gray-400 mb-4">
        Connect your Apple Music account to browse music and save favorites.
      </p>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      <button
        onClick={handleAuthorize}
        disabled={isLoading}
        className="w-full bg-gradient-to-r from-pink-500 to-red-500 text-white py-3 px-6 rounded-lg font-medium hover:from-pink-600 hover:to-red-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        {isLoading ? (
          'Connecting...'
        ) : (
          <>
            <svg
              className="w-5 h-5"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path d="M12 2C6.477 2 2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.879V14.89h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.989C18.343 21.129 22 16.99 22 12c0-5.523-4.477-10-10-10z"/>
            </svg>
            Connect with Apple Music
          </>
        )}
      </button>
    </div>
  );
}
