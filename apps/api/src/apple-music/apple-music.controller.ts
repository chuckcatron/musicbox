import { Controller, Get } from '@nestjs/common';
import { AppleMusicService } from './apple-music.service.js';

@Controller('apple-music')
export class AppleMusicController {
  constructor(private readonly appleMusicService: AppleMusicService) {}

  @Get('token')
  getDeveloperToken(): { token: string } {
    const token = this.appleMusicService.getDeveloperToken();
    return { token };
  }
}
