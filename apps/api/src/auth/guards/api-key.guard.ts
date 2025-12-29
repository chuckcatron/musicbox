import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Request } from 'express';
import { API_HEADERS } from '@music-box/shared';

@Injectable()
export class ApiKeyGuard implements CanActivate {
  constructor(private configService: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    const apiKey = request.headers[API_HEADERS.API_KEY.toLowerCase()] as string;
    const expectedApiKey = this.configService.get<string>('apiKey');

    if (!apiKey || !expectedApiKey) {
      throw new UnauthorizedException('API key required');
    }

    if (apiKey !== expectedApiKey) {
      throw new UnauthorizedException('Invalid API key');
    }

    return true;
  }
}
