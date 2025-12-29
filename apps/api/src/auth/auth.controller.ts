import { Controller, Post, Body, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { AuthService } from './auth.service.js';
import { CognitoJwtGuard } from './guards/cognito-jwt.guard.js';
import { CurrentUser } from './decorators/current-user.decorator.js';
import type { ApiResponse, AppleMusicTokenPayload, CognitoUser } from '@music-box/shared';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('apple-music/token')
  @UseGuards(CognitoJwtGuard)
  @HttpCode(HttpStatus.OK)
  async storeAppleMusicToken(
    @CurrentUser() user: CognitoUser,
    @Body() payload: AppleMusicTokenPayload,
  ): Promise<ApiResponse> {
    await this.authService.storeAppleMusicToken(user.sub, payload);
    return {
      success: true,
      message: 'Apple Music token stored successfully',
    };
  }
}
