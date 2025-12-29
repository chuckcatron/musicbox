'use client';

import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';

export function SignupForm() {
  const { signUp, confirmSignUp, signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [confirmCode, setConfirmCode] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [needsConfirmation, setNeedsConfirmation] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    setIsLoading(true);

    try {
      const result = await signUp(email, password);
      if (result.requiresConfirmation) {
        setNeedsConfirmation(true);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sign up failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirm = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await confirmSignUp(email, confirmCode);
      await signIn(email, password);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Confirmation failed');
    } finally {
      setIsLoading(false);
    }
  };

  if (needsConfirmation) {
    return (
      <form onSubmit={handleConfirm} className="space-y-4">
        <h2 className="text-xl font-semibold text-center">Confirm Your Email</h2>
        <p className="text-sm text-gray-600 dark:text-gray-400 text-center">
          We sent a confirmation code to {email}
        </p>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        <div>
          <label htmlFor="code" className="block text-sm font-medium mb-1">
            Confirmation Code
          </label>
          <input
            id="code"
            type="text"
            value={confirmCode}
            onChange={(e) => setConfirmCode(e.target.value)}
            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-800 dark:border-gray-700"
            required
          />
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-primary-500 text-white py-2 px-4 rounded-lg hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? 'Confirming...' : 'Confirm & Sign In'}
        </button>
      </form>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <h2 className="text-xl font-semibold text-center">Create Account</h2>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      <div>
        <label htmlFor="email" className="block text-sm font-medium mb-1">
          Email
        </label>
        <input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-800 dark:border-gray-700"
          required
        />
      </div>

      <div>
        <label htmlFor="password" className="block text-sm font-medium mb-1">
          Password
        </label>
        <input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-800 dark:border-gray-700"
          required
          minLength={8}
        />
      </div>

      <div>
        <label htmlFor="confirmPassword" className="block text-sm font-medium mb-1">
          Confirm Password
        </label>
        <input
          id="confirmPassword"
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-800 dark:border-gray-700"
          required
          minLength={8}
        />
      </div>

      <button
        type="submit"
        disabled={isLoading}
        className="w-full bg-primary-500 text-white py-2 px-4 rounded-lg hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isLoading ? 'Creating account...' : 'Create Account'}
      </button>
    </form>
  );
}
