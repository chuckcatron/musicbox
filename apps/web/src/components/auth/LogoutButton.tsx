'use client';

import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';

export function LogoutButton() {
  const { signOut } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  const handleLogout = async () => {
    setIsLoading(true);
    try {
      await signOut();
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button
      onClick={handleLogout}
      disabled={isLoading}
      className="text-gray-600 dark:text-gray-300 hover:text-primary-500 disabled:opacity-50"
    >
      {isLoading ? 'Signing out...' : 'Sign Out'}
    </button>
  );
}
