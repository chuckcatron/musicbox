import * as cdk from 'aws-cdk-lib';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as apigateway from 'aws-cdk-lib/aws-apigatewayv2';
import * as apigatewayIntegrations from 'aws-cdk-lib/aws-apigatewayv2-integrations';
import * as cognito from 'aws-cdk-lib/aws-cognito';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import type { Construct } from 'constructs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface ApiStackProps extends cdk.StackProps {
  userPool: cognito.UserPool;
  usersTable: dynamodb.Table;
  favoritesTable: dynamodb.Table;
}

export class ApiStack extends cdk.Stack {
  public readonly apiUrl: string;
  public readonly apiKey: string;

  constructor(scope: Construct, id: string, props: ApiStackProps) {
    super(scope, id, props);

    // Generate API key for Pi devices
    const apiKeyValue = cdk.Names.uniqueId(this).substring(0, 32);

    // Create Lambda function for NestJS API
    // Note: Run `npm run build` in apps/api before deploying
    const apiFunction = new lambda.Function(this, 'ApiFunction', {
      functionName: 'music-box-api',
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: 'dist/main.handler',
      code: lambda.Code.fromAsset(path.join(__dirname, '../../apps/api'), {
        exclude: ['src', '*.ts', 'tsconfig*.json', 'nest-cli.json', '.env*'],
      }),
      timeout: cdk.Duration.seconds(30),
      memorySize: 512,
      environment: {
        NODE_ENV: 'production',
        COGNITO_USER_POOL_ID: props.userPool.userPoolId,
        COGNITO_REGION: this.region,
        USERS_TABLE: props.usersTable.tableName,
        FAVORITES_TABLE: props.favoritesTable.tableName,
        API_KEY: apiKeyValue,
        // Apple Music credentials should be set via SSM or Secrets Manager
        APPLE_MUSIC_TEAM_ID: process.env.APPLE_MUSIC_TEAM_ID || '',
        APPLE_MUSIC_KEY_ID: process.env.APPLE_MUSIC_KEY_ID || '',
        APPLE_MUSIC_PRIVATE_KEY: process.env.APPLE_MUSIC_PRIVATE_KEY || '',
      },
    });

    // Grant DynamoDB permissions
    props.usersTable.grantReadWriteData(apiFunction);
    props.favoritesTable.grantReadWriteData(apiFunction);

    // Create HTTP API
    const httpApi = new apigateway.HttpApi(this, 'MusicBoxApi', {
      apiName: 'music-box-api',
      description: 'Music Box API Gateway',
      corsPreflight: {
        allowOrigins: ['*'],
        allowMethods: [
          apigateway.CorsHttpMethod.GET,
          apigateway.CorsHttpMethod.POST,
          apigateway.CorsHttpMethod.DELETE,
          apigateway.CorsHttpMethod.OPTIONS,
        ],
        allowHeaders: ['Content-Type', 'Authorization', 'x-api-key'],
        maxAge: cdk.Duration.hours(1),
      },
    });

    // Add Lambda integration
    const lambdaIntegration = new apigatewayIntegrations.HttpLambdaIntegration(
      'LambdaIntegration',
      apiFunction
    );

    // Add default route
    httpApi.addRoutes({
      path: '/{proxy+}',
      methods: [apigateway.HttpMethod.ANY],
      integration: lambdaIntegration,
    });

    // Add health check route
    httpApi.addRoutes({
      path: '/health',
      methods: [apigateway.HttpMethod.GET],
      integration: lambdaIntegration,
    });

    this.apiUrl = httpApi.apiEndpoint;
    this.apiKey = apiKeyValue;

    // Outputs
    new cdk.CfnOutput(this, 'ApiEndpoint', {
      value: this.apiUrl,
      description: 'API Gateway Endpoint URL',
      exportName: 'MusicBoxApiEndpoint',
    });

    new cdk.CfnOutput(this, 'ApiKey', {
      value: this.apiKey,
      description: 'API Key for Pi devices',
      exportName: 'MusicBoxApiKey',
    });

    new cdk.CfnOutput(this, 'LambdaFunctionName', {
      value: apiFunction.functionName,
      description: 'Lambda Function Name',
      exportName: 'MusicBoxLambdaName',
    });
  }
}
