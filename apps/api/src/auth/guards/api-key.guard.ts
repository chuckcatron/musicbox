import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SecretsManagerClient, GetSecretValueCommand } from '@aws-sdk/client-secrets-manager';
import { timingSafeEqual } from 'crypto';
import type { Request } from 'express';
import { API_HEADERS } from '@music-box/shared';

@Injectable()
export class ApiKeyGuard implements CanActivate, OnModuleInit {
  private expectedApiKey: string | null = null;
  private secretsClient: SecretsManagerClient | null = null;

  constructor(private configService: ConfigService) {}

  async onModuleInit(): Promise<void> {
    await this.loadApiKey();
  }

  private async loadApiKey(): Promise<void> {
    // First check for direct API key (local development)
    const directApiKey = this.configService.get<string>('apiKey');
    if (directApiKey) {
      this.expectedApiKey = directApiKey;
      return;
    }

    // Otherwise, load from Secrets Manager (production)
    const secretArn = this.configService.get<string>('apiKeySecretArn');
    if (secretArn) {
      this.secretsClient = new SecretsManagerClient({
        region: this.configService.get<string>('aws.region') || 'us-east-1',
      });

      try {
        const command = new GetSecretValueCommand({ SecretId: secretArn });
        const response = await this.secretsClient.send(command);
        if (response.SecretString) {
          this.expectedApiKey = response.SecretString;
          console.log('Loaded API key from Secrets Manager');
        }
      } catch (error) {
        console.error('Failed to load API key from Secrets Manager:', error);
      }
    }
  }

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    const apiKey = request.headers[API_HEADERS.API_KEY.toLowerCase()] as string;

    if (!apiKey || !this.expectedApiKey) {
      throw new UnauthorizedException('API key required');
    }

    // Use timing-safe comparison to prevent timing attacks
    if (!this.timingSafeCompare(apiKey, this.expectedApiKey)) {
      throw new UnauthorizedException('Invalid API key');
    }

    return true;
  }

  private timingSafeCompare(a: string, b: string): boolean {
    // Ensure both strings are the same length to prevent timing leaks
    if (a.length !== b.length) {
      // Still do a comparison to maintain consistent timing
      const dummy = Buffer.from(a);
      timingSafeEqual(dummy, dummy);
      return false;
    }

    const bufferA = Buffer.from(a);
    const bufferB = Buffer.from(b);
    return timingSafeEqual(bufferA, bufferB);
  }
}
