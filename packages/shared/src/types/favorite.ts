export interface Favorite {
  userId: string;
  songId: string;
  name: string;
  artist: string;
  album: string;
  artworkUrl?: string;
  previewUrl?: string;
  durationMs?: number;
  addedAt: string;
}

export interface CreateFavoriteDto {
  songId: string;
  name: string;
  artist: string;
  album: string;
  artworkUrl?: string;
  previewUrl?: string;
  durationMs?: number;
}

export interface FavoritesResponse {
  favorites: Favorite[];
  count: number;
}
