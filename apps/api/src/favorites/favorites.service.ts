import { Injectable, Logger } from '@nestjs/common';
import { DynamoDBService } from '../dynamodb/dynamodb.service.js';
import type {
  Favorite,
  CreateFavoriteDto,
  FavoritesResponse,
} from '@music-box/shared';

@Injectable()
export class FavoritesService {
  private readonly logger = new Logger(FavoritesService.name);

  constructor(private readonly dynamoDBService: DynamoDBService) {}

  async getFavorites(userId: string): Promise<FavoritesResponse> {
    this.logger.debug(`Fetching favorites for user: ${userId}`);

    const result = await this.dynamoDBService.query({
      TableName: this.dynamoDBService.favoritesTable,
      KeyConditionExpression: 'userId = :userId',
      ExpressionAttributeValues: {
        ':userId': userId,
      },
    });

    const favorites = (result.Items as Favorite[]) || [];
    this.logger.debug(`Found ${favorites.length} favorites for user: ${userId}`);

    return {
      favorites,
      count: favorites.length,
    };
  }

  async addFavorite(
    userId: string,
    dto: CreateFavoriteDto,
  ): Promise<Favorite> {
    this.logger.log(`Adding favorite for user: ${userId}, song: ${dto.songId}`);

    const now = new Date().toISOString();

    const favorite: Favorite = {
      userId,
      songId: dto.songId,
      name: dto.name,
      artist: dto.artist,
      album: dto.album,
      artworkUrl: dto.artworkUrl,
      previewUrl: dto.previewUrl,
      durationMs: dto.durationMs,
      addedAt: now,
    };

    await this.dynamoDBService.put({
      TableName: this.dynamoDBService.favoritesTable,
      Item: favorite,
    });

    this.logger.log(`Successfully added favorite: ${dto.name} by ${dto.artist}`);
    return favorite;
  }

  async removeFavorite(userId: string, songId: string): Promise<void> {
    this.logger.log(`Removing favorite for user: ${userId}, song: ${songId}`);

    await this.dynamoDBService.delete({
      TableName: this.dynamoDBService.favoritesTable,
      Key: {
        userId,
        songId,
      },
    });

    this.logger.log(`Successfully removed favorite: ${songId}`);
  }

  async getRandomFavorite(userId: string): Promise<Favorite | null> {
    this.logger.debug(`Getting random favorite for user: ${userId}`);

    // First, get just the songIds to minimize data transfer
    const countResult = await this.dynamoDBService.query({
      TableName: this.dynamoDBService.favoritesTable,
      KeyConditionExpression: 'userId = :userId',
      ExpressionAttributeValues: {
        ':userId': userId,
      },
      ProjectionExpression: 'songId',
      Select: 'SPECIFIC_ATTRIBUTES',
    });

    const songIds = countResult.Items?.map((item) => item.songId as string) || [];

    if (songIds.length === 0) {
      this.logger.debug(`No favorites found for user: ${userId}`);
      return null;
    }

    // Select a random songId and fetch the full record
    const randomIndex = Math.floor(Math.random() * songIds.length);
    const selectedSongId = songIds[randomIndex];

    const selected = await this.getFavorite(userId, selectedSongId);
    if (selected) {
      this.logger.debug(`Selected random favorite: ${selected.name} by ${selected.artist}`);
    }
    return selected;
  }

  async getFavorite(userId: string, songId: string): Promise<Favorite | null> {
    const result = await this.dynamoDBService.get({
      TableName: this.dynamoDBService.favoritesTable,
      Key: {
        userId,
        songId,
      },
    });

    return (result.Item as Favorite) || null;
  }
}
