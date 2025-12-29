import type {
  ApiResponse,
  CreateFavoriteDto,
  FavoritesResponse,
} from '@music-box/shared';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

async function fetchApi<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || 'API request failed');
  }

  return data;
}

export async function storeAppleMusicToken(
  accessToken: string,
  musicUserToken: string
): Promise<ApiResponse> {
  return fetchApi('/auth/apple-music/token', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({
      musicUserToken,
    }),
  });
}

export async function getFavorites(
  accessToken: string
): Promise<ApiResponse<FavoritesResponse>> {
  return fetchApi<FavoritesResponse>('/favorites', {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });
}

export async function addFavorite(
  accessToken: string,
  favorite: CreateFavoriteDto
): Promise<ApiResponse> {
  return fetchApi('/favorites', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(favorite),
  });
}

export async function removeFavorite(
  accessToken: string,
  songId: string
): Promise<ApiResponse> {
  return fetchApi(`/favorites/${encodeURIComponent(songId)}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });
}
