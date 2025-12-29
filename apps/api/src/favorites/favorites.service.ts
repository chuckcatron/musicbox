import { Injectable } from '@nestjs/common';
import { DynamoDBService } from '../dynamodb/dynamodb.service.js';
import type {
  Favorite,
  CreateFavoriteDto,
  FavoritesResponse,
} from '@music-box/shared';

@Injectable()
export class FavoritesService {
  constructor(private readonly dynamoDBService: DynamoDBService) {}

  async getFavorites(userId: string): Promise<FavoritesResponse> {
    const result = await this.dynamoDBService.query({
      TableName: this.dynamoDBService.favoritesTable,
      KeyConditionExpression: 'userId = :userId',
      ExpressionAttributeValues: {
        ':userId': userId,
      },
    });

    const favorites = (result.Items as Favorite[]) || [];

    return {
      favorites,
      count: favorites.length,
    };
  }

  async addFavorite(
    userId: string,
    dto: CreateFavoriteDto,
  ): Promise<Favorite> {
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

    return favorite;
  }

  async removeFavorite(userId: string, songId: string): Promise<void> {
    await this.dynamoDBService.delete({
      TableName: this.dynamoDBService.favoritesTable,
      Key: {
        userId,
        songId,
      },
    });
  }

  async getRandomFavorite(userId: string): Promise<Favorite | null> {
    const { favorites } = await this.getFavorites(userId);

    if (favorites.length === 0) {
      return null;
    }

    const randomIndex = Math.floor(Math.random() * favorites.length);
    return favorites[randomIndex];
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
