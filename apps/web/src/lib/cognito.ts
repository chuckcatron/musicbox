import { Amplify } from 'aws-amplify';

export const cognitoConfig = {
  userPoolId: process.env.NEXT_PUBLIC_COGNITO_USER_POOL_ID || '',
  userPoolClientId: process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID || '',
  region: process.env.NEXT_PUBLIC_COGNITO_REGION || 'us-east-1',
};

export function configureCognito() {
  Amplify.configure({
    Auth: {
      Cognito: {
        userPoolId: cognitoConfig.userPoolId,
        userPoolClientId: cognitoConfig.userPoolClientId,
      },
    },
  });
}
