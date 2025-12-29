'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { SongList } from '@/components/music/SongList';
import { Navigation } from '@/components/layout/Navigation';
import { getFavorites } from '@/lib/api';
import type { Favorite } from '@music-box/shared';

export default function FavoritesPage() {
  const { user, isLoading: authLoading, getAccessToken } = useAuth();
  const [favorites, setFavorites] = useState<Favorite[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadFavorites() {
      if (!user) return;

      try {
        const token = await getAccessToken();
        if (!token) throw new Error('No access token');

        const response = await getFavorites(token);
        if (response.success && response.data) {
          setFavorites(response.data.favorites);
        }
      } catch (err) {
        setError('Failed to load favorites');
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    }

    if (!authLoading) {
      loadFavorites();
    }
  }, [user, authLoading, getAccessToken]);

  const handleRemove = (songId: string) => {
    setFavorites((prev) => prev.filter((f) => f.songId !== songId));
  };

  if (authLoading || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="text-center py-12">
        <h1 className="text-2xl font-bold mb-4">Sign in Required</h1>
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          Please sign in to view your favorites.
        </p>
        <a href="/" className="text-primary-500 hover:underline">
          Go to sign in
        </a>
      </div>
    );
  }

  return (
    <div>
      <Navigation />
      <h1 className="text-2xl font-bold mb-6">Your Favorites</h1>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {favorites.length > 0 ? (
        <SongList
          songs={favorites.map((f) => ({
            id: f.songId,
            name: f.name,
            artistName: f.artist,
            albumName: f.album,
            artworkUrl: f.artworkUrl || '',
            previewUrl: f.previewUrl,
            durationInMillis: f.durationMs || 0,
          }))}
          showRemoveButton
          onRemove={handleRemove}
        />
      ) : (
        <div className="text-center py-12 text-gray-500">
          <p className="mb-4">You haven&apos;t added any favorites yet.</p>
          <a href="/browse/" className="text-primary-500 hover:underline">
            Browse music to add favorites
          </a>
        </div>
      )}
    </div>
  );
}
