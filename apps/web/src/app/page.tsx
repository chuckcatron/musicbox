'use client';

import { useAuth } from '@/hooks/useAuth';
import { LoginForm } from '@/components/auth/LoginForm';
import { SignupForm } from '@/components/auth/SignupForm';
import { MusicKitAuth } from '@/components/music/MusicKitAuth';
import { useState } from 'react';

export default function HomePage() {
  const { user, isLoading } = useAuth();
  const [showSignup, setShowSignup] = useState(false);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  if (user) {
    return (
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Welcome to Music Box</h1>
        <p className="text-gray-600 dark:text-gray-300 mb-8">
          Connect your Apple Music account to start adding favorites that your
          Pi jukebox can play.
        </p>

        <MusicKitAuth />

        <div className="mt-8 grid gap-4">
          <a
            href="/browse/"
            className="block p-6 bg-white dark:bg-gray-800 rounded-lg shadow hover:shadow-lg transition-shadow"
          >
            <h2 className="text-xl font-semibold mb-2">Browse Music</h2>
            <p className="text-gray-600 dark:text-gray-400">
              Search the Apple Music catalog and add songs to your favorites.
            </p>
          </a>

          <a
            href="/favorites/"
            className="block p-6 bg-white dark:bg-gray-800 rounded-lg shadow hover:shadow-lg transition-shadow"
          >
            <h2 className="text-xl font-semibold mb-2">Your Favorites</h2>
            <p className="text-gray-600 dark:text-gray-400">
              View and manage your saved favorite songs.
            </p>
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto">
      <h1 className="text-3xl font-bold text-center mb-8">Music Box</h1>

      {showSignup ? (
        <>
          <SignupForm />
          <p className="text-center mt-4 text-gray-600 dark:text-gray-400">
            Already have an account?{' '}
            <button
              onClick={() => setShowSignup(false)}
              className="text-primary-500 hover:underline"
            >
              Sign in
            </button>
          </p>
        </>
      ) : (
        <>
          <LoginForm />
          <p className="text-center mt-4 text-gray-600 dark:text-gray-400">
            Don&apos;t have an account?{' '}
            <button
              onClick={() => setShowSignup(true)}
              className="text-primary-500 hover:underline"
            >
              Sign up
            </button>
          </p>
        </>
      )}
    </div>
  );
}
