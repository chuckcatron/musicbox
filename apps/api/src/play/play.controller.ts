import {
  Controller,
  Get,
  Param,
  Query,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import { PlayService } from './play.service.js';
import { ApiKeyGuard } from '../auth/guards/api-key.guard.js';
import type { ApiResponse, PlayResponse } from '@music-box/shared';

@Controller('play')
@UseGuards(ApiKeyGuard)
export class PlayController {
  constructor(private readonly playService: PlayService) {}

  @Get('random')
  async playRandom(
    @Query('userId') userId: string,
  ): Promise<ApiResponse<PlayResponse>> {
    if (!userId) {
      throw new BadRequestException('userId query parameter is required');
    }

    const result = await this.playService.getRandomSongStreamUrl(userId);
    return {
      success: true,
      data: result,
    };
  }

  @Get(':songId')
  async playSong(
    @Param('songId') songId: string,
    @Query('userId') userId: string,
  ): Promise<ApiResponse<PlayResponse>> {
    if (!userId) {
      throw new BadRequestException('userId query parameter is required');
    }

    const result = await this.playService.getSongStreamUrl(userId, songId);
    return {
      success: true,
      data: result,
    };
  }
}
