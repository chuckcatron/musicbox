import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import { Test, TestingModule } from '@nestjs/testing';
import { FavoritesService } from './favorites.service';
import { DynamoDBService } from '../dynamodb/dynamodb.service';
import { Favorite, CreateFavoriteDto } from '@music-box/shared';

describe('FavoritesService', () => {
  let service: FavoritesService;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mockQuery = jest.fn<() => Promise<{ Items?: any[] }>>();
  const mockPut = jest.fn<() => Promise<object>>();
  const mockDelete = jest.fn<() => Promise<object>>();
  const mockGet = jest.fn<() => Promise<{ Item?: Favorite }>>();

  const mockDynamoDBService = {
    favoritesTable: 'test-favorites-table',
    query: mockQuery,
    put: mockPut,
    delete: mockDelete,
    get: mockGet,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FavoritesService,
        {
          provide: DynamoDBService,
          useValue: mockDynamoDBService,
        },
      ],
    }).compile();

    service = module.get<FavoritesService>(FavoritesService);

    // Clear all mocks before each test
    jest.clearAllMocks();
  });

  describe('getFavorites', () => {
    it('should return favorites for a user', async () => {
      const mockFavorites: Favorite[] = [
        {
          userId: 'user-123',
          songId: 'song-1',
          name: 'Test Song',
          artist: 'Test Artist',
          album: 'Test Album',
          addedAt: '2024-01-01T00:00:00.000Z',
        },
        {
          userId: 'user-123',
          songId: 'song-2',
          name: 'Another Song',
          artist: 'Another Artist',
          album: 'Another Album',
          addedAt: '2024-01-02T00:00:00.000Z',
        },
      ];

      mockQuery.mockResolvedValue({ Items: mockFavorites });

      const result = await service.getFavorites('user-123');

      expect(result.favorites).toEqual(mockFavorites);
      expect(result.count).toBe(2);
      expect(mockQuery).toHaveBeenCalledWith({
        TableName: 'test-favorites-table',
        KeyConditionExpression: 'userId = :userId',
        ExpressionAttributeValues: {
          ':userId': 'user-123',
        },
      });
    });

    it('should return empty array when user has no favorites', async () => {
      mockQuery.mockResolvedValue({ Items: [] });

      const result = await service.getFavorites('user-456');

      expect(result.favorites).toEqual([]);
      expect(result.count).toBe(0);
    });

    it('should handle undefined Items from DynamoDB', async () => {
      mockQuery.mockResolvedValue({});

      const result = await service.getFavorites('user-789');

      expect(result.favorites).toEqual([]);
      expect(result.count).toBe(0);
    });
  });

  describe('addFavorite', () => {
    it('should add a favorite and return it', async () => {
      const dto: CreateFavoriteDto = {
        songId: 'song-new',
        name: 'New Song',
        artist: 'New Artist',
        album: 'New Album',
        artworkUrl: 'https://example.com/artwork.jpg',
        previewUrl: 'https://example.com/preview.mp3',
        durationMs: 180000,
      };

      mockPut.mockResolvedValue({});

      const result = await service.addFavorite('user-123', dto);

      expect(result.userId).toBe('user-123');
      expect(result.songId).toBe('song-new');
      expect(result.name).toBe('New Song');
      expect(result.artist).toBe('New Artist');
      expect(result.album).toBe('New Album');
      expect(result.artworkUrl).toBe('https://example.com/artwork.jpg');
      expect(result.previewUrl).toBe('https://example.com/preview.mp3');
      expect(result.durationMs).toBe(180000);
      expect(result.addedAt).toBeDefined();

      expect(mockPut).toHaveBeenCalledWith({
        TableName: 'test-favorites-table',
        Item: expect.objectContaining({
          userId: 'user-123',
          songId: 'song-new',
        }),
      });
    });

    it('should handle optional fields', async () => {
      const dto: CreateFavoriteDto = {
        songId: 'song-minimal',
        name: 'Minimal Song',
        artist: 'Minimal Artist',
        album: 'Minimal Album',
      };

      mockPut.mockResolvedValue({});

      const result = await service.addFavorite('user-123', dto);

      expect(result.artworkUrl).toBeUndefined();
      expect(result.previewUrl).toBeUndefined();
      expect(result.durationMs).toBeUndefined();
    });
  });

  describe('removeFavorite', () => {
    it('should remove a favorite', async () => {
      mockDelete.mockResolvedValue({});

      await service.removeFavorite('user-123', 'song-1');

      expect(mockDelete).toHaveBeenCalledWith({
        TableName: 'test-favorites-table',
        Key: {
          userId: 'user-123',
          songId: 'song-1',
        },
      });
    });
  });

  describe('getRandomFavorite', () => {
    it('should return a random favorite', async () => {
      const mockSongIds = [{ songId: 'song-1' }, { songId: 'song-2' }];
      const mockFavorite: Favorite = {
        userId: 'user-123',
        songId: 'song-1',
        name: 'Song 1',
        artist: 'Artist 1',
        album: 'Album 1',
        addedAt: '2024-01-01T00:00:00.000Z',
      };

      // First call returns songIds, second call (via getFavorite) returns full record
      mockQuery.mockResolvedValue({ Items: mockSongIds });
      mockGet.mockResolvedValue({ Item: mockFavorite });

      const result = await service.getRandomFavorite('user-123');

      expect(result).not.toBeNull();
      expect(result?.userId).toBe('user-123');
      expect(['song-1', 'song-2']).toContain(result?.songId);
    });

    it('should return null when user has no favorites', async () => {
      mockQuery.mockResolvedValue({ Items: [] });

      const result = await service.getRandomFavorite('user-456');

      expect(result).toBeNull();
    });
  });

  describe('getFavorite', () => {
    it('should return a specific favorite', async () => {
      const mockFavorite: Favorite = {
        userId: 'user-123',
        songId: 'song-1',
        name: 'Test Song',
        artist: 'Test Artist',
        album: 'Test Album',
        addedAt: '2024-01-01T00:00:00.000Z',
      };

      mockGet.mockResolvedValue({ Item: mockFavorite });

      const result = await service.getFavorite('user-123', 'song-1');

      expect(result).toEqual(mockFavorite);
      expect(mockGet).toHaveBeenCalledWith({
        TableName: 'test-favorites-table',
        Key: {
          userId: 'user-123',
          songId: 'song-1',
        },
      });
    });

    it('should return null when favorite not found', async () => {
      mockGet.mockResolvedValue({});

      const result = await service.getFavorite('user-123', 'nonexistent');

      expect(result).toBeNull();
    });
  });
});
