import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ConfigService } from '@nestjs/config';
import { Strategy, ExtractJwt } from 'passport-jwt';
import { passportJwtSecret } from 'jwks-rsa';
import type { CognitoUser } from '@music-box/shared';

interface CognitoJwtPayload {
  sub: string;
  email: string;
  email_verified: boolean;
  token_use: string;
  auth_time: number;
  iss: string;
  exp: number;
  iat: number;
}

@Injectable()
export class CognitoJwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(private configService: ConfigService) {
    const userPoolId = configService.get<string>('cognito.userPoolId');
    const region = configService.get<string>('cognito.region');
    const issuer = `https://cognito-idp.${region}.amazonaws.com/${userPoolId}`;

    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      issuer,
      algorithms: ['RS256'],
      secretOrKeyProvider: passportJwtSecret({
        cache: true,
        rateLimit: true,
        jwksRequestsPerMinute: 10,
        jwksUri: `${issuer}/.well-known/jwks.json`,
      }),
    });
  }

  validate(payload: CognitoJwtPayload): CognitoUser {
    if (payload.token_use !== 'id' && payload.token_use !== 'access') {
      throw new UnauthorizedException('Invalid token type');
    }

    return {
      sub: payload.sub,
      email: payload.email,
      email_verified: payload.email_verified,
    };
  }
}
