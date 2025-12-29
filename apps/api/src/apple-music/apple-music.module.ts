import { Module, Global } from '@nestjs/common';
import { AppleMusicService } from './apple-music.service.js';

@Global()
@Module({
  providers: [AppleMusicService],
  exports: [AppleMusicService],
})
export class AppleMusicModule {}
