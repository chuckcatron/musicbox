import { Injectable } from '@nestjs/common';
import { DynamoDBService } from '../dynamodb/dynamodb.service.js';
import type { AppleMusicTokenPayload, User } from '@music-box/shared';

@Injectable()
export class AuthService {
  constructor(private readonly dynamoDBService: DynamoDBService) {}

  async storeAppleMusicToken(
    userId: string,
    payload: AppleMusicTokenPayload,
  ): Promise<void> {
    const now = new Date().toISOString();
    const expiresIn = payload.expiresIn || 86400; // Default 24 hours
    const tokenExpiry = new Date(Date.now() + expiresIn * 1000).toISOString();

    await this.dynamoDBService.update({
      TableName: this.dynamoDBService.usersTable,
      Key: { userId },
      UpdateExpression:
        'SET appleMusicToken = :token, tokenExpiry = :expiry, updatedAt = :now',
      ExpressionAttributeValues: {
        ':token': payload.musicUserToken,
        ':expiry': tokenExpiry,
        ':now': now,
      },
    });
  }

  async getUser(userId: string): Promise<User | null> {
    const result = await this.dynamoDBService.get({
      TableName: this.dynamoDBService.usersTable,
      Key: { userId },
    });

    return (result.Item as User) || null;
  }

  async createUserIfNotExists(userId: string, email: string): Promise<void> {
    const existingUser = await this.getUser(userId);
    if (existingUser) return;

    const now = new Date().toISOString();
    await this.dynamoDBService.put({
      TableName: this.dynamoDBService.usersTable,
      Item: {
        userId,
        email,
        createdAt: now,
        updatedAt: now,
      },
    });
  }
}
