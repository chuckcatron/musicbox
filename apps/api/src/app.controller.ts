import { Controller, Get } from '@nestjs/common';
import type { HealthResponse } from '@music-box/shared';

@Controller()
export class AppController {
  @Get('health')
  getHealth(): HealthResponse {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
    };
  }
}
