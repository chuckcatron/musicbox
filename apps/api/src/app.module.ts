import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller.js';
import { AuthModule } from './auth/auth.module.js';
import { FavoritesModule } from './favorites/favorites.module.js';
import { PlayModule } from './play/play.module.js';
import { DynamoDBModule } from './dynamodb/dynamodb.module.js';
import { AppleMusicModule } from './apple-music/apple-music.module.js';
import configuration from './config/configuration.js';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
    }),
    DynamoDBModule,
    AuthModule,
    FavoritesModule,
    PlayModule,
    AppleMusicModule,
  ],
  controllers: [AppController],
})
export class AppModule {}
