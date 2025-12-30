import * as cdk from 'aws-cdk-lib';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as apigateway from 'aws-cdk-lib/aws-apigatewayv2';
import * as apigatewayIntegrations from 'aws-cdk-lib/aws-apigatewayv2-integrations';
import * as cognito from 'aws-cdk-lib/aws-cognito';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as secretsmanager from 'aws-cdk-lib/aws-secretsmanager';
import type { Construct } from 'constructs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface ApiStackProps extends cdk.StackProps {
  userPool: cognito.UserPool;
  usersTable: dynamodb.Table;
  favoritesTable: dynamodb.Table;
  corsOrigins?: string[]; // Allowed CORS origins for web app
}

export class ApiStack extends cdk.Stack {
  public readonly apiUrl: string;
  public readonly apiKeySecretArn: string;

  constructor(scope: Construct, id: string, props: ApiStackProps) {
    super(scope, id, props);

    // Generate a secure API key using Secrets Manager
    const apiKeySecret = new secretsmanager.Secret(this, 'ApiKeySecret', {
      secretName: 'music-box/api-key',
      description: 'API Key for Music Box Pi devices',
      generateSecretString: {
        excludePunctuation: true,
        includeSpace: false,
        passwordLength: 32,
      },
    });

    // Reference the secret ARN instead of exposing the value
    const apiKeySecretArn = apiKeySecret.secretArn;

    // Create Apple Music credentials secret as a placeholder
    // The actual credentials must be populated manually via AWS CLI or Console:
    // aws secretsmanager put-secret-value --secret-id music-box/apple-music \
    //   --secret-string '{"teamId":"YOUR_TEAM_ID","keyId":"YOUR_KEY_ID","privateKey":"YOUR_PRIVATE_KEY"}'
    const appleMusicSecret = new secretsmanager.Secret(this, 'AppleMusicSecret', {
      secretName: 'music-box/apple-music',
      description: 'Apple Music API credentials - populate via AWS CLI after deployment',
    });

    // CORS origins - default to allowing localhost for development
    const corsOrigins = props.corsOrigins || ['http://localhost:3000'];
    const corsOriginsString = corsOrigins.join(',');

    // Create Lambda function for NestJS API
    // Use the lambda-bundle directory created by the build:lambda script
    const apiFunction = new lambda.Function(this, 'ApiFunction', {
      functionName: 'music-box-api',
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: 'dist/main.handler',
      code: lambda.Code.fromAsset(path.join(__dirname, '../../apps/api/lambda-bundle')),
      timeout: cdk.Duration.seconds(30),
      memorySize: 512,
      environment: {
        NODE_ENV: 'production',
        COGNITO_USER_POOL_ID: props.userPool.userPoolId,
        COGNITO_REGION: this.region,
        USERS_TABLE: props.usersTable.tableName,
        FAVORITES_TABLE: props.favoritesTable.tableName,
        API_KEY_SECRET_ARN: apiKeySecretArn,
        APPLE_MUSIC_SECRET_ARN: appleMusicSecret.secretArn,
        CORS_ORIGIN: corsOriginsString,
      },
    });

    // Grant Lambda permission to read secrets
    apiKeySecret.grantRead(apiFunction);
    appleMusicSecret.grantRead(apiFunction);

    // Grant DynamoDB permissions
    props.usersTable.grantReadWriteData(apiFunction);
    props.favoritesTable.grantReadWriteData(apiFunction);

    // Create HTTP API
    const httpApi = new apigateway.HttpApi(this, 'MusicBoxApi', {
      apiName: 'music-box-api',
      description: 'Music Box API Gateway',
      corsPreflight: {
        allowOrigins: corsOrigins,
        allowMethods: [
          apigateway.CorsHttpMethod.GET,
          apigateway.CorsHttpMethod.POST,
          apigateway.CorsHttpMethod.DELETE,
          apigateway.CorsHttpMethod.OPTIONS,
        ],
        allowHeaders: ['Content-Type', 'Authorization', 'x-api-key'],
        allowCredentials: true,
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
    this.apiKeySecretArn = apiKeySecretArn;

    // Outputs
    new cdk.CfnOutput(this, 'ApiEndpoint', {
      value: this.apiUrl,
      description: 'API Gateway Endpoint URL',
      exportName: 'MusicBoxApiEndpoint',
    });

    new cdk.CfnOutput(this, 'ApiKeySecretArn', {
      value: apiKeySecretArn,
      description: 'Secrets Manager ARN for API Key - fetch with: aws secretsmanager get-secret-value --secret-id <arn>',
      exportName: 'MusicBoxApiKeySecretArn',
    });

    new cdk.CfnOutput(this, 'AppleMusicSecretArn', {
      value: appleMusicSecret.secretArn,
      description: 'Secrets Manager ARN for Apple Music credentials',
      exportName: 'MusicBoxAppleMusicSecretArn',
    });

    new cdk.CfnOutput(this, 'LambdaFunctionName', {
      value: apiFunction.functionName,
      description: 'Lambda Function Name',
      exportName: 'MusicBoxLambdaName',
    });
  }
}
