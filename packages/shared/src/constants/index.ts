export const DYNAMO_TABLES = {
  USERS: 'music-box-users',
  FAVORITES: 'music-box-favorites',
} as const;

export const API_HEADERS = {
  API_KEY: 'x-api-key',
  AUTHORIZATION: 'Authorization',
} as const;

export const COGNITO_GROUPS = {
  ADMIN: 'admin',
  USER: 'user',
} as const;

export const APPLE_MUSIC = {
  API_BASE_URL: 'https://api.music.apple.com/v1',
  TOKEN_EXPIRY_BUFFER_MS: 5 * 60 * 1000, // 5 minutes
} as const;
