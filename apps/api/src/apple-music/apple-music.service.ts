import { Injectable, UnauthorizedException, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SecretsManagerClient, GetSecretValueCommand } from '@aws-sdk/client-secrets-manager';
import jwt from 'jsonwebtoken';
import { APPLE_MUSIC } from '@music-box/shared';
import type { AppleMusicSongResponse, AppleMusicAttributes } from './apple-music.types.js';

interface AppleMusicCredentials {
  teamId: string;
  keyId: string;
  privateKey: string;
}

@Injectable()
export class AppleMusicService implements OnModuleInit {
  private developerToken: string | null = null;
  private tokenExpiry: number = 0;
  private credentials: AppleMusicCredentials | null = null;
  private secretsClient: SecretsManagerClient | null = null;

  constructor(private configService: ConfigService) {}

  async onModuleInit(): Promise<void> {
    // Initialize SecretsManager client here to ensure ConfigService is ready
    this.secretsClient = new SecretsManagerClient({
      region: this.configService.get<string>('aws.region') || 'us-east-1',
    });
    await this.loadCredentials();
  }

  private async loadCredentials(): Promise<void> {
    // First try to get from Secrets Manager (production)
    const secretArn = this.configService.get<string>('appleMusic.secretArn');

    if (secretArn && this.secretsClient) {
      try {
        const command = new GetSecretValueCommand({ SecretId: secretArn });
        const response = await this.secretsClient.send(command);

        if (response.SecretString) {
          this.credentials = JSON.parse(response.SecretString);
          console.log('Loaded Apple Music credentials from Secrets Manager');
          return;
        }
      } catch (error) {
        console.error('Failed to load credentials from Secrets Manager:', error);
      }
    }

    // Fall back to environment variables (local development)
    const teamId = this.configService.get<string>('appleMusic.teamId');
    const keyId = this.configService.get<string>('appleMusic.keyId');
    const privateKey = this.configService.get<string>('appleMusic.privateKey');

    if (teamId && keyId && privateKey) {
      this.credentials = { teamId, keyId, privateKey };
      console.log('Loaded Apple Music credentials from environment');
    }
  }

  private generateDeveloperToken(): string {
    if (!this.credentials) {
      throw new Error('Apple Music credentials not loaded');
    }

    const { teamId, keyId, privateKey } = this.credentials;

    // Token valid for 6 months (max allowed)
    const expiresIn = 15777000;
    const now = Math.floor(Date.now() / 1000);

    const token = jwt.sign({}, privateKey.replace(/\\n/g, '\n'), {
      algorithm: 'ES256',
      expiresIn,
      issuer: teamId,
      header: {
        alg: 'ES256',
        kid: keyId,
      },
    });

    this.developerToken = token;
    this.tokenExpiry = now + expiresIn - Math.floor(APPLE_MUSIC.TOKEN_EXPIRY_BUFFER_MS / 1000);

    return token;
  }

  getDeveloperToken(): string {
    const now = Math.floor(Date.now() / 1000);

    if (!this.developerToken || now >= this.tokenExpiry) {
      return this.generateDeveloperToken();
    }

    return this.developerToken;
  }

  async getSongStreamUrl(
    songId: string,
    musicUserToken: string,
  ): Promise<string> {
    const developerToken = this.getDeveloperToken();

    const response = await fetch(
      `${APPLE_MUSIC.API_BASE_URL}/catalog/us/songs/${songId}`,
      {
        headers: {
          Authorization: `Bearer ${developerToken}`,
          'Music-User-Token': musicUserToken,
        },
      },
    );

    if (!response.ok) {
      if (response.status === 401) {
        throw new UnauthorizedException('Apple Music token expired or invalid');
      }
      throw new Error(`Apple Music API error: ${response.status}`);
    }

    const data = (await response.json()) as AppleMusicSongResponse;
    const song = data.data?.[0];

    if (!song) {
      throw new Error('Song not found');
    }

    // The previews array contains preview URLs
    // For full playback, you need the playParams which requires MusicKit
    const previewUrl = song.attributes.previews?.[0]?.url;

    if (!previewUrl) {
      throw new Error('No preview URL available for this song');
    }

    return previewUrl;
  }

  async getSongDetails(
    songId: string,
    musicUserToken: string,
  ): Promise<AppleMusicAttributes> {
    const developerToken = this.getDeveloperToken();

    const response = await fetch(
      `${APPLE_MUSIC.API_BASE_URL}/catalog/us/songs/${songId}`,
      {
        headers: {
          Authorization: `Bearer ${developerToken}`,
          'Music-User-Token': musicUserToken,
        },
      },
    );

    if (!response.ok) {
      throw new Error(`Apple Music API error: ${response.status}`);
    }

    const data = (await response.json()) as AppleMusicSongResponse;
    const song = data.data?.[0];

    if (!song) {
      throw new Error('Song not found');
    }

    return song.attributes;
  }
}
