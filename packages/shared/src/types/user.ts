export interface User {
  userId: string;
  email: string;
  appleMusicToken?: string;
  tokenExpiry?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AppleMusicTokenPayload {
  musicUserToken: string;
  expiresIn?: number;
}

export interface CognitoUser {
  sub: string;
  email: string;
  email_verified: boolean;
}
