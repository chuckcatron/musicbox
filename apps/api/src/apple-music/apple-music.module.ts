import { Module, Global } from '@nestjs/common';
import { AppleMusicService } from './apple-music.service.js';
import { AppleMusicController } from './apple-music.controller.js';

@Global()
@Module({
  controllers: [AppleMusicController],
  providers: [AppleMusicService],
  exports: [AppleMusicService],
})
export class AppleMusicModule {}
