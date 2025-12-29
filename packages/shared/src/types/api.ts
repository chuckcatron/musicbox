export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PlayResponse {
  songId: string;
  name: string;
  artist: string;
  streamUrl: string;
  artworkUrl?: string;
  durationMs?: number;
}

export interface HealthResponse {
  status: 'ok' | 'error';
  timestamp: string;
  version: string;
}
