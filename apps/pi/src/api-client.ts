import { config } from './config.js';
import type { ApiResponse, PlayResponse } from '@music-box/shared';

export class ApiClient {
  private baseUrl: string;
  private apiKey: string;
  private userId: string;

  constructor() {
    this.baseUrl = config.apiUrl;
    this.apiKey = config.apiKey;
    this.userId = config.userId;
  }

  private async request<T>(endpoint: string): Promise<ApiResponse<T>> {
    const url = `${this.baseUrl}${endpoint}`;

    const response = await fetch(url, {
      headers: {
        'x-api-key': this.apiKey,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`API Error (${response.status}): ${error}`);
    }

    return response.json() as Promise<ApiResponse<T>>;
  }

  async getRandomSong(): Promise<PlayResponse> {
    const response = await this.request<PlayResponse>(
      `/play/random?userId=${encodeURIComponent(this.userId)}`
    );

    if (!response.success || !response.data) {
      throw new Error(response.error || 'Failed to get random song');
    }

    return response.data;
  }

  async getSong(songId: string): Promise<PlayResponse> {
    const response = await this.request<PlayResponse>(
      `/play/${encodeURIComponent(songId)}?userId=${encodeURIComponent(this.userId)}`
    );

    if (!response.success || !response.data) {
      throw new Error(response.error || 'Failed to get song');
    }

    return response.data;
  }
}
