import * as cdk from 'aws-cdk-lib';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import type { Construct } from 'constructs';

export class DataStack extends cdk.Stack {
  public readonly usersTable: dynamodb.Table;
  public readonly favoritesTable: dynamodb.Table;

  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Users table - stores user info and Apple Music tokens
    this.usersTable = new dynamodb.Table(this, 'UsersTable', {
      tableName: 'music-box-users',
      partitionKey: {
        name: 'userId',
        type: dynamodb.AttributeType.STRING,
      },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
      pointInTimeRecoverySpecification: {
        pointInTimeRecoveryEnabled: true,
      },
    });

    // Favorites table - stores user's favorite songs
    this.favoritesTable = new dynamodb.Table(this, 'FavoritesTable', {
      tableName: 'music-box-favorites',
      partitionKey: {
        name: 'userId',
        type: dynamodb.AttributeType.STRING,
      },
      sortKey: {
        name: 'songId',
        type: dynamodb.AttributeType.STRING,
      },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
      pointInTimeRecoverySpecification: {
        pointInTimeRecoveryEnabled: true,
      },
    });

    // Add GSI for querying favorites by addedAt date
    this.favoritesTable.addGlobalSecondaryIndex({
      indexName: 'userId-addedAt-index',
      partitionKey: {
        name: 'userId',
        type: dynamodb.AttributeType.STRING,
      },
      sortKey: {
        name: 'addedAt',
        type: dynamodb.AttributeType.STRING,
      },
      projectionType: dynamodb.ProjectionType.ALL,
    });

    // Outputs
    new cdk.CfnOutput(this, 'UsersTableName', {
      value: this.usersTable.tableName,
      description: 'Users DynamoDB Table Name',
      exportName: 'MusicBoxUsersTableName',
    });

    new cdk.CfnOutput(this, 'UsersTableArn', {
      value: this.usersTable.tableArn,
      description: 'Users DynamoDB Table ARN',
      exportName: 'MusicBoxUsersTableArn',
    });

    new cdk.CfnOutput(this, 'FavoritesTableName', {
      value: this.favoritesTable.tableName,
      description: 'Favorites DynamoDB Table Name',
      exportName: 'MusicBoxFavoritesTableName',
    });

    new cdk.CfnOutput(this, 'FavoritesTableArn', {
      value: this.favoritesTable.tableArn,
      description: 'Favorites DynamoDB Table ARN',
      exportName: 'MusicBoxFavoritesTableArn',
    });
  }
}
