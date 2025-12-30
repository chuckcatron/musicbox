import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import { ApiKeyGuard } from './api-key.guard';
import { ConfigService } from '@nestjs/config';
import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { API_HEADERS } from '@music-box/shared';

describe('ApiKeyGuard', () => {
  let guard: ApiKeyGuard;
  let mockConfigService: { get: jest.Mock };

  const createMockContext = (apiKey?: string): ExecutionContext => {
    const headers: Record<string, string> = {};
    if (apiKey) {
      headers[API_HEADERS.API_KEY.toLowerCase()] = apiKey;
    }

    return {
      switchToHttp: () => ({
        getRequest: () => ({
          headers,
        }),
      }),
    } as unknown as ExecutionContext;
  };

  beforeEach(async () => {
    mockConfigService = {
      get: jest.fn(),
    };

    guard = new ApiKeyGuard(mockConfigService as unknown as ConfigService);
  });

  describe('with direct API key configured', () => {
    beforeEach(async () => {
      mockConfigService.get.mockImplementation((key: string) => {
        if (key === 'apiKey') return 'test-api-key-12345';
        return undefined;
      });
      await guard.onModuleInit();
    });

    it('should allow request with valid API key', () => {
      const context = createMockContext('test-api-key-12345');
      expect(guard.canActivate(context)).toBe(true);
    });

    it('should reject request with invalid API key', () => {
      const context = createMockContext('wrong-api-key');
      expect(() => guard.canActivate(context)).toThrow(UnauthorizedException);
      expect(() => guard.canActivate(context)).toThrow('Invalid API key');
    });

    it('should reject request with missing API key', () => {
      const context = createMockContext();
      expect(() => guard.canActivate(context)).toThrow(UnauthorizedException);
      expect(() => guard.canActivate(context)).toThrow('API key required');
    });

    it('should reject request with empty API key', () => {
      const context = createMockContext('');
      expect(() => guard.canActivate(context)).toThrow(UnauthorizedException);
      expect(() => guard.canActivate(context)).toThrow('API key required');
    });

    it('should reject API keys of different length', () => {
      const context = createMockContext('short');
      expect(() => guard.canActivate(context)).toThrow(UnauthorizedException);
      expect(() => guard.canActivate(context)).toThrow('Invalid API key');
    });
  });

  describe('without API key configured', () => {
    beforeEach(async () => {
      mockConfigService.get.mockReturnValue(undefined);
      await guard.onModuleInit();
    });

    it('should reject all requests when no API key is configured', () => {
      const context = createMockContext('any-api-key');
      expect(() => guard.canActivate(context)).toThrow(UnauthorizedException);
      expect(() => guard.canActivate(context)).toThrow('API key required');
    });
  });
});
