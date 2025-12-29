import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { AuthController } from './auth.controller.js';
import { AuthService } from './auth.service.js';
import { CognitoJwtStrategy } from './strategies/cognito-jwt.strategy.js';
import { CognitoJwtGuard } from './guards/cognito-jwt.guard.js';
import { ApiKeyGuard } from './guards/api-key.guard.js';

@Module({
  imports: [PassportModule.register({ defaultStrategy: 'jwt' })],
  controllers: [AuthController],
  providers: [AuthService, CognitoJwtStrategy, CognitoJwtGuard, ApiKeyGuard],
  exports: [AuthService, CognitoJwtGuard, ApiKeyGuard],
})
export class AuthModule {}
