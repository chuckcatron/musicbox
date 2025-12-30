import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { FavoritesService } from './favorites.service.js';
import { CognitoJwtGuard } from '../auth/guards/cognito-jwt.guard.js';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import { CreateFavoriteDto } from './dto/create-favorite.dto.js';
import { SongIdParam } from '../common/dto/song-id.param.js';
import type {
  ApiResponse,
  CognitoUser,
  FavoritesResponse,
} from '@music-box/shared';

@Controller('favorites')
@UseGuards(CognitoJwtGuard)
export class FavoritesController {
  constructor(private readonly favoritesService: FavoritesService) {}

  @Get()
  async getFavorites(
    @CurrentUser() user: CognitoUser,
  ): Promise<ApiResponse<FavoritesResponse>> {
    const result = await this.favoritesService.getFavorites(user.sub);
    return {
      success: true,
      data: result,
    };
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async addFavorite(
    @CurrentUser() user: CognitoUser,
    @Body() createFavoriteDto: CreateFavoriteDto,
  ): Promise<ApiResponse> {
    await this.favoritesService.addFavorite(user.sub, createFavoriteDto);
    return {
      success: true,
      message: 'Favorite added successfully',
    };
  }

  @Delete(':songId')
  @HttpCode(HttpStatus.OK)
  async removeFavorite(
    @CurrentUser() user: CognitoUser,
    @Param() params: SongIdParam,
  ): Promise<ApiResponse> {
    await this.favoritesService.removeFavorite(user.sub, params.songId);
    return {
      success: true,
      message: 'Favorite removed successfully',
    };
  }
}
