import { Module } from '@nestjs/common';
import { PlayController } from './play.controller.js';
import { PlayService } from './play.service.js';
import { FavoritesModule } from '../favorites/favorites.module.js';
import { AuthModule } from '../auth/auth.module.js';

@Module({
  imports: [FavoritesModule, AuthModule],
  controllers: [PlayController],
  providers: [PlayService],
})
export class PlayModule {}
