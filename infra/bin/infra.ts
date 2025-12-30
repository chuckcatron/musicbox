#!/usr/bin/env node
import 'source-map-support/register.js';
import * as cdk from 'aws-cdk-lib';
import { AuthStack } from '../lib/auth-stack.js';
import { DataStack } from '../lib/data-stack.js';
import { ApiStack } from '../lib/api-stack.js';
import { WebStack } from '../lib/web-stack.js';

const app = new cdk.App();

const env = {
  account: process.env.CDK_DEFAULT_ACCOUNT,
  region: process.env.CDK_DEFAULT_REGION || 'us-east-1',
};

// Auth stack - Cognito User Pool
const authStack = new AuthStack(app, 'MusicBoxAuthStack', {
  env,
  description: 'Music Box - Cognito User Pool and App Client',
});

// Data stack - DynamoDB tables
const dataStack = new DataStack(app, 'MusicBoxDataStack', {
  env,
  description: 'Music Box - DynamoDB tables for users and favorites',
});

// CORS origins for web app - add your production domain here
const corsOrigins = [
  'http://localhost:3000', // Local development
  // Add production domain when deployed, e.g.:
  // 'https://music-box.example.com',
];

// API stack - Lambda + API Gateway
const apiStack = new ApiStack(app, 'MusicBoxApiStack', {
  env,
  description: 'Music Box - NestJS Lambda API',
  userPool: authStack.userPool,
  usersTable: dataStack.usersTable,
  favoritesTable: dataStack.favoritesTable,
  corsOrigins,
});
apiStack.addDependency(authStack);
apiStack.addDependency(dataStack);

// Web stack - S3 + CloudFront
const webStack = new WebStack(app, 'MusicBoxWebStack', {
  env,
  description: 'Music Box - Static web hosting',
  apiUrl: apiStack.apiUrl,
  userPoolId: authStack.userPool.userPoolId,
  userPoolClientId: authStack.userPoolClient.userPoolClientId,
});
webStack.addDependency(apiStack);

app.synth();
