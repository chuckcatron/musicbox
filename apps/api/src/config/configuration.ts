export default () => ({
  port: parseInt(process.env.PORT || '3001', 10),
  aws: {
    region: process.env.AWS_REGION || 'us-east-1',
  },
  cognito: {
    userPoolId: process.env.COGNITO_USER_POOL_ID || '',
    clientId: process.env.COGNITO_CLIENT_ID || '',
    region: process.env.COGNITO_REGION || process.env.AWS_REGION || 'us-east-1',
  },
  dynamodb: {
    usersTable: process.env.USERS_TABLE || 'music-box-users',
    favoritesTable: process.env.FAVORITES_TABLE || 'music-box-favorites',
  },
  appleMusic: {
    teamId: process.env.APPLE_MUSIC_TEAM_ID || '',
    keyId: process.env.APPLE_MUSIC_KEY_ID || '',
    privateKey: process.env.APPLE_MUSIC_PRIVATE_KEY || '',
    secretArn: process.env.APPLE_MUSIC_SECRET_ARN || '',
  },
  apiKey: process.env.API_KEY || '',
  corsOrigin: process.env.CORS_ORIGIN || '*',
});
