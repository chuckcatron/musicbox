import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import {
  DynamoDBDocumentClient,
  GetCommand,
  PutCommand,
  DeleteCommand,
  QueryCommand,
  UpdateCommand,
  type GetCommandInput,
  type PutCommandInput,
  type DeleteCommandInput,
  type QueryCommandInput,
  type UpdateCommandInput,
} from '@aws-sdk/lib-dynamodb';

@Injectable()
export class DynamoDBService {
  private readonly client: DynamoDBDocumentClient;
  public readonly usersTable: string;
  public readonly favoritesTable: string;

  constructor(private configService: ConfigService) {
    const dynamoClient = new DynamoDBClient({
      region: this.configService.get<string>('aws.region'),
    });

    this.client = DynamoDBDocumentClient.from(dynamoClient, {
      marshallOptions: {
        removeUndefinedValues: true,
      },
    });

    this.usersTable = this.configService.get<string>('dynamodb.usersTable')!;
    this.favoritesTable = this.configService.get<string>('dynamodb.favoritesTable')!;
  }

  async get(params: GetCommandInput) {
    return this.client.send(new GetCommand(params));
  }

  async put(params: PutCommandInput) {
    return this.client.send(new PutCommand(params));
  }

  async delete(params: DeleteCommandInput) {
    return this.client.send(new DeleteCommand(params));
  }

  async query(params: QueryCommandInput) {
    return this.client.send(new QueryCommand(params));
  }

  async update(params: UpdateCommandInput) {
    return this.client.send(new UpdateCommand(params));
  }
}
