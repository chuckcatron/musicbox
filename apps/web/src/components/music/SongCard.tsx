'use client';

import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { addFavorite, removeFavorite } from '@/lib/api';

interface Song {
  id: string;
  name: string;
  artistName: string;
  albumName: string;
  artworkUrl: string;
  previewUrl?: string;
  durationInMillis: number;
}

interface SongCardProps {
  song: Song;
  showAddButton?: boolean;
  showRemoveButton?: boolean;
  onRemove?: (songId: string) => void;
}

export function SongCard({
  song,
  showAddButton,
  showRemoveButton,
  onRemove,
}: SongCardProps) {
  const { getAccessToken } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [isAdded, setIsAdded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const formatDuration = (ms: number) => {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const handleAdd = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const token = await getAccessToken();
      if (!token) throw new Error('Not authenticated');

      await addFavorite(token, {
        songId: song.id,
        name: song.name,
        artist: song.artistName,
        album: song.albumName,
        artworkUrl: song.artworkUrl,
        previewUrl: song.previewUrl,
        durationMs: song.durationInMillis,
      });
      setIsAdded(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemove = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const token = await getAccessToken();
      if (!token) throw new Error('Not authenticated');

      await removeFavorite(token, song.id);
      onRemove?.(song.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center gap-4 p-4 bg-white dark:bg-gray-800 rounded-lg shadow">
      {song.artworkUrl && (
        <img
          src={song.artworkUrl}
          alt={song.name}
          className="w-16 h-16 rounded"
        />
      )}

      <div className="flex-1 min-w-0">
        <h3 className="font-medium truncate">{song.name}</h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
          {song.artistName}
        </p>
        <p className="text-xs text-gray-500 truncate">{song.albumName}</p>
      </div>

      <div className="flex items-center gap-3">
        <span className="text-sm text-gray-500">
          {formatDuration(song.durationInMillis)}
        </span>

        {showAddButton && !isAdded && (
          <button
            onClick={handleAdd}
            disabled={isLoading}
            className="px-3 py-1 bg-primary-500 text-white text-sm rounded hover:bg-primary-600 disabled:opacity-50"
          >
            {isLoading ? '...' : 'Add'}
          </button>
        )}

        {showAddButton && isAdded && (
          <span className="text-green-600 text-sm">Added!</span>
        )}

        {showRemoveButton && (
          <button
            onClick={handleRemove}
            disabled={isLoading}
            className="px-3 py-1 bg-red-500 text-white text-sm rounded hover:bg-red-600 disabled:opacity-50"
          >
            {isLoading ? '...' : 'Remove'}
          </button>
        )}
      </div>

      {error && (
        <span className="text-red-500 text-xs">{error}</span>
      )}
    </div>
  );
}
