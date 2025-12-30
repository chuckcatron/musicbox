import { Controller, Get, Logger } from '@nestjs/common';
import { DynamoDBService } from './dynamodb/dynamodb.service.js';
import type { HealthResponse, DependencyHealth } from '@music-box/shared';

@Controller()
export class AppController {
  private readonly logger = new Logger(AppController.name);

  constructor(private readonly dynamoDBService: DynamoDBService) {}

  @Get('health')
  async getHealth(): Promise<HealthResponse> {
    const dependencies: DependencyHealth[] = [];

    // Check DynamoDB connectivity
    const dynamoHealth = await this.checkDynamoDB();
    dependencies.push(dynamoHealth);

    // Determine overall status
    const allHealthy = dependencies.every((d) => d.status === 'healthy');
    const allUnhealthy = dependencies.every((d) => d.status === 'unhealthy');

    let status: 'ok' | 'degraded' | 'error';
    if (allHealthy) {
      status = 'ok';
    } else if (allUnhealthy) {
      status = 'error';
    } else {
      status = 'degraded';
    }

    return {
      status,
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      dependencies,
    };
  }

  private async checkDynamoDB(): Promise<DependencyHealth> {
    const start = Date.now();
    try {
      // Perform a simple query to verify connectivity
      await this.dynamoDBService.query({
        TableName: this.dynamoDBService.favoritesTable,
        KeyConditionExpression: 'userId = :userId',
        ExpressionAttributeValues: {
          ':userId': '__health_check__',
        },
        Limit: 1,
      });

      const latencyMs = Date.now() - start;
      this.logger.debug(`DynamoDB health check passed in ${latencyMs}ms`);

      return {
        name: 'dynamodb',
        status: 'healthy',
        latencyMs,
      };
    } catch (error) {
      const latencyMs = Date.now() - start;
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`DynamoDB health check failed: ${errorMessage}`);

      return {
        name: 'dynamodb',
        status: 'unhealthy',
        latencyMs,
        error: errorMessage,
      };
    }
  }
}
