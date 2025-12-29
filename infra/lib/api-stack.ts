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
}

export class ApiStack extends cdk.Stack {
  public readonly apiUrl: string;
  public readonly apiKey: string;

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

    const apiKeyValue = apiKeySecret.secretValue.unsafeUnwrap();

    // Create Apple Music credentials secret with the actual values
    const appleMusicSecret = new secretsmanager.Secret(this, 'AppleMusicSecret', {
      secretName: 'music-box/apple-music',
      description: 'Apple Music API credentials',
      secretStringValue: cdk.SecretValue.unsafePlainText(JSON.stringify({
        teamId: '4ZYQBHA5X3',
        keyId: 'JRQQN78Q5T',
        privateKey: `-----BEGIN PRIVATE KEY-----
MIGTAgEAMBMGByqGSM49AgEGCCqGSM49AwEHBHkwdwIBAQQga2hD49EcF9B0khji
NaFTP+7ONtSujWPCPGtQigswmU+gCgYIKoZIzj0DAQehRANCAAQ70pO9yLkkF1Ip
Rk6OMMSo4SxFTQsK//02T+kDer0LsqmpWtVnp4iXjcI3WOZgwCOVOKXFpGE4Z5IQ
dXK60KM+
-----END PRIVATE KEY-----`
      })),
    });

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
        // Reference the secret ARN so Lambda can fetch it at runtime
        APPLE_MUSIC_SECRET_ARN: appleMusicSecret.secretArn,
      },
    });

    // Grant Lambda permission to read the Apple Music secret
    appleMusicSecret.grantRead(apiFunction);

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
