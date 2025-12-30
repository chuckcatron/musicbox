import {
  Injectable,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { FavoritesService } from '../favorites/favorites.service.js';
import { AppleMusicService } from '../apple-music/apple-music.service.js';
import { AuthService } from '../auth/auth.service.js';
import type { PlayResponse } from '@music-box/shared';

@Injectable()
export class PlayService {
  private readonly logger = new Logger(PlayService.name);

  constructor(
    private readonly favoritesService: FavoritesService,
    private readonly appleMusicService: AppleMusicService,
    private readonly authService: AuthService,
  ) {}

  private async getUserMusicToken(userId: string): Promise<string> {
    const user = await this.authService.getUser(userId);

    if (!user?.appleMusicToken) {
      throw new UnauthorizedException(
        'User has not connected Apple Music account',
      );
    }

    // Check if token is expired
    if (user.tokenExpiry && new Date(user.tokenExpiry) < new Date()) {
      throw new UnauthorizedException('Apple Music token has expired');
    }

    return user.appleMusicToken;
  }

  async getRandomSongStreamUrl(userId: string): Promise<PlayResponse> {
    this.logger.log(`Getting random song stream for user: ${userId}`);

    const favorite = await this.favoritesService.getRandomFavorite(userId);

    if (!favorite) {
      this.logger.warn(`No favorites found for user: ${userId}`);
      throw new NotFoundException('No favorites found for this user');
    }

    this.logger.debug(`Selected song: ${favorite.name} by ${favorite.artist}`);
    const musicUserToken = await this.getUserMusicToken(userId);
    const streamUrl = await this.appleMusicService.getSongStreamUrl(
      favorite.songId,
      musicUserToken,
    );

    this.logger.log(`Successfully retrieved stream URL for: ${favorite.name}`);
    return {
      songId: favorite.songId,
      name: favorite.name,
      artist: favorite.artist,
      streamUrl,
      artworkUrl: favorite.artworkUrl,
      durationMs: favorite.durationMs,
    };
  }

  async getSongStreamUrl(userId: string, songId: string): Promise<PlayResponse> {
    this.logger.log(`Getting stream for song: ${songId}, user: ${userId}`);

    const favorite = await this.favoritesService.getFavorite(userId, songId);

    if (!favorite) {
      this.logger.warn(`Song not found in favorites: ${songId}`);
      throw new NotFoundException('Song not found in favorites');
    }

    const musicUserToken = await this.getUserMusicToken(userId);
    const streamUrl = await this.appleMusicService.getSongStreamUrl(
      songId,
      musicUserToken,
    );

    this.logger.log(`Successfully retrieved stream URL for: ${favorite.name}`);
    return {
      songId: favorite.songId,
      name: favorite.name,
      artist: favorite.artist,
      streamUrl,
      artworkUrl: favorite.artworkUrl,
      durationMs: favorite.durationMs,
    };
  }
}
