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

export interface DependencyHealth {
  name: string;
  status: 'healthy' | 'unhealthy';
  latencyMs?: number;
  error?: string;
}

export interface HealthResponse {
  status: 'ok' | 'degraded' | 'error';
  timestamp: string;
  version: string;
  dependencies?: DependencyHealth[];
}
