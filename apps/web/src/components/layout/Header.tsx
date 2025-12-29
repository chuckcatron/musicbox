'use client';

import { useAuth } from '@/hooks/useAuth';
import { LogoutButton } from '@/components/auth/LogoutButton';

export function Header() {
  const { user } = useAuth();

  return (
    <header className="bg-white dark:bg-gray-900 shadow">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <a href="/" className="text-xl font-bold text-primary-500">
            Music Box
          </a>

          {user && (
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {user.email}
              </span>
              <LogoutButton />
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
