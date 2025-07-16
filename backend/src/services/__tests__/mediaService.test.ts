import { mediaService, MediaService, MediaProcessingOptions, MediaSearchOptions, MediaCleanupPolicy } from '../mediaService';
import { metaApiService } from '../metaApi';
import fs from 'fs/promises';
import path from 'path';
import sharp from 'sharp';

// Mock dependencies
jest.mock('../metaApi');
jest.mock('fs/promises');
jest.mock('sharp');

const mockMetaApiService = metaApiService as jest.Mocked<typeof metaApiService>;
const mockFs = fs as jest.Mocked<typeof fs>;
const mockSharp = sharp as jest.MockedFunction<typeof sharp>;

describe('MediaService', () => {
  let service: MediaService;
  const mockFile: Express.Multer.File = {
    fieldname: 'file',
    originalname: 'test-image.jpg',
    encoding: '7bit',
    mimetype: 'image/jpeg',
    size: 1024000,
    destination: '/tmp',
    filename: 'test-file',
    path: '/tmp/test-file',
    buffer: Buffer.from('test'),
    stream: {} as any
  };

  beforeEach(() => {
    jest.clearAllMocks();
    service = new MediaService();
    
    // Mock fs operations
    mockFs.mkdir.mockResolvedValue(undefined);
    mockFs.rename.mockResolvedValue(undefined);
    mockFs.stat.mockResolvedValue({ size: 1024000 } as any);
    mockFs.readFile.mockResolvedValue(Buffer.from('test'));
    mockFs.writeFile.mockResolvedValue(undefined);
    mockFs.unlink.mockResolvedValue(undefined);
    mockFs.access.mockResolvedValue(undefined);
    mockFs.readdir.mockResolvedValue([]);

    // Mock sharp operations
    const mockSharpInstance = {
      metadata: jest.fn().mockResolvedValue({ width: 800, height: 600 }),
      clone: jest.fn().mockReturnThis(),
      resize: jest.fn().mockReturnThis(),
      jpeg: jest.fn().mockReturnThis(),
      png: jest.fn().mockReturnThis(),
      webp: jest.fn().mockReturnThis(),
      toFile: jest.fn().mockResolvedValue(undefined)
    };
    mockSharp.mockReturnValue(mockSharpInstance as any);
  });

  describe('uploadMedia', () => {
    it('should upload media successfully', async () => {
      const result = await service.uploadMedia(mockFile, 'user123');

      expect(result.metadata).toBeDefined();
      expect(result.metadata.originalName).toBe('test-image.jpg');
      expect(result.metadata.mimeType).toBe('image/jpeg');
      expect(result.metadata.uploadedBy).toBe('user123');
      expect(result.localPath).toBeDefined();
      expect(mockFs.rename).toHaveBeenCalled();
    });

    it('should upload to Meta API when requested', async () => {
      mockMetaApiService.uploadMedia.mockResolvedValue({
        id: 'meta-123',
        url: 'https://meta.com/media/123',
        mime_type: 'image/jpeg',
        file_size: 1024000
      });

      const result = await service.uploadMedia(mockFile, 'user123', {}, true);

      expect(result.metaUploadResult).toBeDefined();
      expect(result.metadata.metaMediaId).toBe('meta-123');
      expect(result.metadata.metaMediaUrl).toBe('https://meta.com/media/123');
      expect(mockMetaApiService.uploadMedia).toHaveBeenCalled();
    });

    it('should process images with thumbnails and optimization', async () => {
      const options: MediaProcessingOptions = {
        generateThumbnail: true,
        optimize: true,
        maxWidth: 1920,
        maxHeight: 1080,
        quality: 85
      };

      const result = await service.uploadMedia(mockFile, 'user123', options);

      expect(result.processingResults).toBeDefined();
      expect(result.processingResults!.length).toBeGreaterThan(0);
      expect(mockSharp).toHaveBeenCalled();
    });

    it('should handle upload errors gracefully', async () => {
      mockFs.rename.mockRejectedValue(new Error('File system error'));

      await expect(service.uploadMedia(mockFile, 'user123')).rejects.toThrow('File system error');
      expect(mockFs.unlink).toHaveBeenCalled(); // Cleanup on failure
    });

    it('should validate file types', async () => {
      const invalidFile = { ...mockFile, mimetype: 'application/exe' };

      await expect(service.uploadMedia(invalidFile, 'user123')).rejects.toThrow('File type application/exe not allowed');
    });

    it('should validate file size', async () => {
      const largeFile = { ...mockFile, size: 50 * 1024 * 1024 }; // 50MB

      await expect(service.uploadMedia(largeFile, 'user123')).rejects.toThrow('exceeds maximum allowed size');
    });

    it('should validate file names', async () => {
      const maliciousFile = { ...mockFile, originalname: '../../../etc/passwd' };

      await expect(service.uploadMedia(maliciousFile, 'user123')).rejects.toThrow('Invalid file name');
    });
  });

  describe('getMedia', () => {
    it('should retrieve media metadata', async () => {
      const mockMetadata = {
        id: 'test-123',
        originalName: 'test.jpg',
        filename: 'test-123.jpg',
        mimeType: 'image/jpeg',
        size: 1024000,
        uploadedAt: new Date(),
        uploadedBy: 'user123',
        tags: [],
        isPublic: false
      };

      mockFs.readFile.mockResolvedValue(JSON.stringify(mockMetadata));

      const result = await service.getMedia('test-123');

      expect(result).toBeDefined();
      expect(result!.id).toBe('test-123');
      expect(result!.originalName).toBe('test.jpg');
    });

    it('should return null for non-existent media', async () => {
      mockFs.readFile.mockRejectedValue(new Error('File not found'));

      const result = await service.getMedia('non-existent');

      expect(result).toBeNull();
    });
  });

  describe('getMediaStream', () => {
    it('should return file stream for existing media', async () => {
      const mockMetadata = {
        id: 'test-123',
        filename: 'test-123.jpg',
        uploadedAt: new Date(),
        uploadedBy: 'user123',
        originalName: 'test.jpg',
        mimeType: 'image/jpeg',
        size: 1024000,
        tags: [],
        isPublic: false
      };

      mockFs.readFile.mockResolvedValue(JSON.stringify(mockMetadata));
      
      // Mock createReadStream
      const mockCreateReadStream = jest.fn().mockReturnValue({} as any);
      jest.doMock('fs', () => ({
        createReadStream: mockCreateReadStream
      }));

      const result = await service.getMediaStream('test-123');

      expect(mockFs.access).toHaveBeenCalled();
    });

    it('should return null for non-existent files', async () => {
      mockFs.readFile.mockResolvedValue(JSON.stringify({
        id: 'test-123',
        filename: 'test-123.jpg'
      }));
      mockFs.access.mockRejectedValue(new Error('File not found'));

      const result = await service.getMediaStream('test-123');

      expect(result).toBeNull();
    });
  });

  describe('searchMedia', () => {
    beforeEach(() => {
      const mockMediaList = [
        {
          id: '1',
          originalName: 'image1.jpg',
          filename: '1.jpg',
          mimeType: 'image/jpeg',
          size: 1000,
          uploadedAt: new Date('2024-01-01'),
          uploadedBy: 'user1',
          tags: ['nature', 'landscape'],
          isPublic: true
        },
        {
          id: '2',
          originalName: 'document.pdf',
          filename: '2.pdf',
          mimeType: 'application/pdf',
          size: 2000,
          uploadedAt: new Date('2024-01-02'),
          uploadedBy: 'user2',
          tags: ['document'],
          isPublic: false
        }
      ];

      mockFs.readdir.mockResolvedValue(['1.meta.json', '2.meta.json'] as any);
      mockFs.readFile
        .mockResolvedValueOnce(JSON.stringify(mockMediaList[0]))
        .mockResolvedValueOnce(JSON.stringify(mockMediaList[1]));
    });

    it('should search media by mime type', async () => {
      const options: MediaSearchOptions = {
        mimeType: 'image/jpeg'
      };

      const result = await service.searchMedia(options);

      expect(result.media).toHaveLength(1);
      expect(result.media[0].mimeType).toBe('image/jpeg');
      expect(result.total).toBe(1);
    });

    it('should search media by tags', async () => {
      const options: MediaSearchOptions = {
        tags: ['nature']
      };

      const result = await service.searchMedia(options);

      expect(result.media).toHaveLength(1);
      expect(result.media[0].tags).toContain('nature');
    });

    it('should search media by user', async () => {
      const options: MediaSearchOptions = {
        uploadedBy: 'user1'
      };

      const result = await service.searchMedia(options);

      expect(result.media).toHaveLength(1);
      expect(result.media[0].uploadedBy).toBe('user1');
    });

    it('should search media by public status', async () => {
      const options: MediaSearchOptions = {
        isPublic: true
      };

      const result = await service.searchMedia(options);

      expect(result.media).toHaveLength(1);
      expect(result.media[0].isPublic).toBe(true);
    });

    it('should paginate results', async () => {
      const options: MediaSearchOptions = {
        limit: 1,
        offset: 0
      };

      const result = await service.searchMedia(options);

      expect(result.media).toHaveLength(1);
      expect(result.total).toBe(2);
    });

    it('should sort results', async () => {
      const options: MediaSearchOptions = {
        sortBy: 'size',
        sortOrder: 'desc'
      };

      const result = await service.searchMedia(options);

      expect(result.media[0].size).toBeGreaterThan(result.media[1].size);
    });
  });

  describe('updateMedia', () => {
    it('should update media metadata', async () => {
      const mockMetadata = {
        id: 'test-123',
        originalName: 'test.jpg',
        filename: 'test-123.jpg',
        mimeType: 'image/jpeg',
        size: 1024000,
        uploadedAt: new Date(),
        uploadedBy: 'user123',
        tags: [],
        isPublic: false
      };

      mockFs.readFile.mockResolvedValue(JSON.stringify(mockMetadata));

      const updates = {
        tags: ['updated', 'test'],
        description: 'Updated description',
        isPublic: true
      };

      const result = await service.updateMedia('test-123', updates);

      expect(result).toBeDefined();
      expect(result!.tags).toEqual(['updated', 'test']);
      expect(result!.description).toBe('Updated description');
      expect(result!.isPublic).toBe(true);
      expect(mockFs.writeFile).toHaveBeenCalled();
    });

    it('should return null for non-existent media', async () => {
      mockFs.readFile.mockRejectedValue(new Error('File not found'));

      const result = await service.updateMedia('non-existent', { tags: ['test'] });

      expect(result).toBeNull();
    });
  });

  describe('deleteMedia', () => {
    it('should delete media successfully', async () => {
      const mockMetadata = {
        id: 'test-123',
        filename: 'test-123.jpg',
        thumbnailPath: '/uploads/thumbnails/thumb_test-123.jpg',
        optimizedPath: '/uploads/optimized/opt_test-123.jpg',
        uploadedAt: new Date(),
        uploadedBy: 'user123',
        originalName: 'test.jpg',
        mimeType: 'image/jpeg',
        size: 1024000,
        tags: [],
        isPublic: false
      };

      mockFs.readFile.mockResolvedValue(JSON.stringify(mockMetadata));

      const result = await service.deleteMedia('test-123');

      expect(result).toBe(true);
      expect(mockFs.unlink).toHaveBeenCalledTimes(4); // Original + thumbnail + optimized + metadata
    });

    it('should return false for non-existent media', async () => {
      mockFs.readFile.mockRejectedValue(new Error('File not found'));

      const result = await service.deleteMedia('non-existent');

      expect(result).toBe(false);
    });
  });

  describe('cleanupMedia', () => {
    beforeEach(() => {
      const oldDate = new Date(Date.now() - 40 * 24 * 60 * 60 * 1000); // 40 days ago
      const recentDate = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000); // 5 days ago

      const mockMediaList = [
        {
          id: '1',
          originalName: 'old-image.jpg',
          filename: '1.jpg',
          mimeType: 'image/jpeg',
          size: 1000000,
          uploadedAt: oldDate,
          uploadedBy: 'user1',
          tags: [],
          isPublic: false
        },
        {
          id: '2',
          originalName: 'recent-image.jpg',
          filename: '2.jpg',
          mimeType: 'image/jpeg',
          size: 500000,
          uploadedAt: recentDate,
          uploadedBy: 'user2',
          tags: [],
          isPublic: false,
          metaMediaId: 'meta-123'
        }
      ];

      mockFs.readdir.mockResolvedValue(['1.meta.json', '2.meta.json'] as any);
      mockFs.readFile
        .mockResolvedValueOnce(JSON.stringify(mockMediaList[0]))
        .mockResolvedValueOnce(JSON.stringify(mockMediaList[1]))
        .mockResolvedValueOnce(JSON.stringify(mockMediaList[1])); // For remaining files check
    });

    it('should cleanup old files based on age', async () => {
      const policy: MediaCleanupPolicy = {
        maxAge: 30 // 30 days
      };

      const result = await service.cleanupMedia(policy);

      expect(result.deletedCount).toBe(1);
      expect(result.freedSpace).toBe(1000000);
    });

    it('should preserve Meta-uploaded files when specified', async () => {
      const policy: MediaCleanupPolicy = {
        maxAge: 1, // Very short age to trigger cleanup
        preserveMetaUploaded: true
      };

      const result = await service.cleanupMedia(policy);

      expect(result.deletedCount).toBe(1); // Only the file without metaMediaId
    });

    it('should cleanup unused files', async () => {
      const policy: MediaCleanupPolicy = {
        deleteUnused: true
      };

      const result = await service.cleanupMedia(policy);

      expect(result.deletedCount).toBe(1); // File without metaMediaId
    });
  });

  describe('getCDNUrl', () => {
    it('should return CDN URL when configured', () => {
      process.env.CDN_BASE_URL = 'https://cdn.example.com';
      const service = new MediaService();

      const url = service.getCDNUrl('test-123', 'thumbnail');

      expect(url).toBe('https://cdn.example.com/media/test-123/thumbnail');
    });

    it('should return local URL when CDN not configured', () => {
      delete process.env.CDN_BASE_URL;
      const service = new MediaService();

      const url = service.getCDNUrl('test-123', 'original');

      expect(url).toBe('/api/media/test-123/original');
    });
  });

  describe('getMediaStats', () => {
    beforeEach(() => {
      const mockMediaList = [
        {
          id: '1',
          mimeType: 'image/jpeg',
          size: 1000000,
          uploadedAt: new Date('2024-01-01')
        },
        {
          id: '2',
          mimeType: 'image/png',
          size: 2000000,
          uploadedAt: new Date('2024-01-02')
        },
        {
          id: '3',
          mimeType: 'image/jpeg',
          size: 1500000,
          uploadedAt: new Date('2024-01-03')
        }
      ];

      mockFs.readdir.mockResolvedValue(['1.meta.json', '2.meta.json', '3.meta.json'] as any);
      mockFs.readFile
        .mockResolvedValueOnce(JSON.stringify(mockMediaList[0]))
        .mockResolvedValueOnce(JSON.stringify(mockMediaList[1]))
        .mockResolvedValueOnce(JSON.stringify(mockMediaList[2]));
    });

    it('should return comprehensive media statistics', async () => {
      const stats = await service.getMediaStats();

      expect(stats.totalFiles).toBe(3);
      expect(stats.totalSize).toBe(4500000);
      expect(stats.averageSize).toBe(1500000);
      expect(stats.mimeTypeDistribution['image/jpeg']).toBe(2);
      expect(stats.mimeTypeDistribution['image/png']).toBe(1);
      expect(stats.uploadTrends).toBeDefined();
    });
  });

  describe('Error handling', () => {
    it('should handle file system errors gracefully', async () => {
      mockFs.mkdir.mockRejectedValue(new Error('Permission denied'));

      // Should not throw during initialization
      expect(() => new MediaService()).not.toThrow();
    });

    it('should handle sharp processing errors gracefully', async () => {
      mockSharp.mockImplementation(() => {
        throw new Error('Sharp processing error');
      });

      const result = await service.uploadMedia(mockFile, 'user123', { generateThumbnail: true });

      // Should still upload successfully even if processing fails
      expect(result.metadata).toBeDefined();
      expect(result.processingResults).toEqual([]);
    });

    it('should handle Meta API errors gracefully', async () => {
      mockMetaApiService.uploadMedia.mockRejectedValue(new Error('Meta API error'));

      const result = await service.uploadMedia(mockFile, 'user123', {}, true);

      // Should still upload locally even if Meta upload fails
      expect(result.metadata).toBeDefined();
      expect(result.metaUploadResult).toBeUndefined();
    });
  });
});