'use client';

import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useMusicKit } from '@/hooks/useMusicKit';
import { SearchBar } from '@/components/music/SearchBar';
import { SongList } from '@/components/music/SongList';
import { Navigation } from '@/components/layout/Navigation';

interface Song {
  id: string;
  name: string;
  artistName: string;
  albumName: string;
  artworkUrl: string;
  previewUrl?: string;
  durationInMillis: number;
}

export default function BrowsePage() {
  const { user, isLoading: authLoading } = useAuth();
  const { isAuthorized, isLoading: musicKitLoading } = useMusicKit();
  const [songs, setSongs] = useState<Song[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const handleSearch = async (query: string) => {
    if (!query.trim() || !window.MusicKit) return;

    setIsSearching(true);
    try {
      const music = window.MusicKit.getInstance();
      const results = await music.api.music(`/v1/catalog/us/search`, {
        term: query,
        types: 'songs',
        limit: 25,
      });

      const songsData = results.data.results.songs?.data || [];
      setSongs(
        songsData.map((song: { id: string; attributes: { name: string; artistName: string; albumName: string; artwork: { url: string }; previews?: { url: string }[]; durationInMillis: number } }) => ({
          id: song.id,
          name: song.attributes.name,
          artistName: song.attributes.artistName,
          albumName: song.attributes.albumName,
          artworkUrl: song.attributes.artwork.url
            .replace('{w}', '200')
            .replace('{h}', '200'),
          previewUrl: song.attributes.previews?.[0]?.url,
          durationInMillis: song.attributes.durationInMillis,
        }))
      );
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setIsSearching(false);
    }
  };

  if (authLoading || musicKitLoading) {
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
          Please sign in to browse music.
        </p>
        <a href="/" className="text-primary-500 hover:underline">
          Go to sign in
        </a>
      </div>
    );
  }

  if (!isAuthorized) {
    return (
      <div className="text-center py-12">
        <h1 className="text-2xl font-bold mb-4">Apple Music Required</h1>
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          Please connect your Apple Music account to browse music.
        </p>
        <a href="/" className="text-primary-500 hover:underline">
          Go to home page
        </a>
      </div>
    );
  }

  return (
    <div>
      <Navigation />
      <h1 className="text-2xl font-bold mb-6">Browse Music</h1>

      <SearchBar onSearch={handleSearch} isLoading={isSearching} />

      {songs.length > 0 && (
        <div className="mt-6">
          <SongList songs={songs} showAddButton />
        </div>
      )}

      {songs.length === 0 && !isSearching && (
        <div className="text-center py-12 text-gray-500">
          Search for songs to add to your favorites
        </div>
      )}
    </div>
  );
}
