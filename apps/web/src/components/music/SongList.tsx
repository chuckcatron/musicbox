'use client';

import { SongCard } from './SongCard';

interface Song {
  id: string;
  name: string;
  artistName: string;
  albumName: string;
  artworkUrl: string;
  previewUrl?: string;
  durationInMillis: number;
}

interface SongListProps {
  songs: Song[];
  showAddButton?: boolean;
  showRemoveButton?: boolean;
  onRemove?: (songId: string) => void;
}

export function SongList({
  songs,
  showAddButton,
  showRemoveButton,
  onRemove,
}: SongListProps) {
  return (
    <div className="space-y-2">
      {songs.map((song) => (
        <SongCard
          key={song.id}
          song={song}
          showAddButton={showAddButton}
          showRemoveButton={showRemoveButton}
          onRemove={onRemove}
        />
      ))}
    </div>
  );
}
