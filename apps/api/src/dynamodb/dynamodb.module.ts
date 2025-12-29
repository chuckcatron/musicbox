import { Module, Global } from '@nestjs/common';
import { DynamoDBService } from './dynamodb.service.js';

@Global()
@Module({
  providers: [DynamoDBService],
  exports: [DynamoDBService],
})
export class DynamoDBModule {}
