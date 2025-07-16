import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';
import { metaApiService, MediaFile, MediaUploadResponse } from './metaApi';
import { logger } from '@/utils/logger';

// Simple media interfaces for flow images
export interface MediaMetadata {
  id: string;
  originalName: string;
  filename: string;
  mimeType: string;
  size: number;
  uploadedAt: Date;
  metaMediaId?: string;
  metaMediaUrl?: string;
}

export interface MediaUploadResult {
  metadata: MediaMetadata;
  localPath: string;
  metaUploadResult?: MediaUploadResponse;
}

export class MediaService {
  private uploadPath: string;
  private maxFileSize: number;
  private allowedMimeTypes: string[];

  constructor() {
    this.uploadPath = process.env.UPLOAD_PATH || 'uploads';
    this.maxFileSize = parseInt(process.env.MAX_FILE_SIZE || '5242880'); // 5MB default
    this.allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp'];

    this.initializeDirectories();
  }

  private async initializeDirectories(): Promise<void> {
    try {
      await fs.mkdir(this.uploadPath, { recursive: true });
    } catch (error) {
      logger.error('Failed to initialize media directories', { error });
    }
  }

  /**
   * Simple media upload for flow images
   */
  async uploadMedia(
    file: Express.Multer.File,
    uploadToMeta: boolean = false
  ): Promise<MediaUploadResult> {
    try {
      // Basic validation
      if (!this.allowedMimeTypes.includes(file.mimetype)) {
        throw new Error(`File type ${file.mimetype} not allowed. Only images are supported.`);
      }

      if (file.size > this.maxFileSize) {
        throw new Error(`File size exceeds maximum allowed size of ${this.maxFileSize} bytes`);
      }

      // Generate unique filename
      const fileId = this.generateFileId();
      const ext = path.extname(file.originalname);
      const filename = `${fileId}${ext}`;
      const finalFilePath = path.join(this.uploadPath, filename);

      // Move file to permanent location
      await fs.rename(file.path, finalFilePath);

      // Get file stats
      const stats = await fs.stat(finalFilePath);

      // Create metadata
      const metadata: MediaMetadata = {
        id: fileId,
        originalName: file.originalname,
        filename,
        mimeType: file.mimetype,
        size: stats.size,
        uploadedAt: new Date()
      };

      // Upload to Meta if requested
      let metaUploadResult: MediaUploadResponse | undefined;
      if (uploadToMeta) {
        try {
          const fileBuffer = await fs.readFile(finalFilePath);
          const mediaFile: MediaFile = {
            file: fileBuffer,
            type: file.mimetype as any,
            filename: file.originalname
          };
          
          metaUploadResult = await metaApiService.uploadMedia(mediaFile);
          metadata.metaMediaId = metaUploadResult.id;
          metadata.metaMediaUrl = metaUploadResult.url;

          logger.info('Media uploaded to Meta API', {
            fileId,
            metaMediaId: metaUploadResult.id
          });

        } catch (error) {
          logger.error('Failed to upload to Meta API', { filename: file.originalname, error });
          // Continue without Meta upload
        }
      }

      // Store metadata
      await this.storeMetadata(metadata);

      logger.info('Media uploaded successfully', {
        fileId,
        filename: file.originalname,
        size: stats.size,
        metaUploaded: !!metaUploadResult
      });

      return {
        metadata,
        localPath: finalFilePath,
        metaUploadResult
      };

    } catch (error) {
      logger.error('Media upload failed', { 
        filename: file.originalname, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
      
      // Cleanup on failure
      try {
        if (file.path) {
          await fs.unlink(file.path);
        }
      } catch (cleanupError) {
        // Ignore cleanup errors
      }
      
      throw error;
    }
  }

  /**
   * Get media by ID
   */
  async getMedia(mediaId: string): Promise<MediaMetadata | null> {
    try {
      return await this.getMetadataFromStorage(mediaId);
    } catch (error) {
      logger.error('Failed to get media', { mediaId, error });
      return null;
    }
  }

  /**
   * Get media file stream
   */
  async getMediaStream(mediaId: string): Promise<NodeJS.ReadableStream | null> {
    try {
      const metadata = await this.getMedia(mediaId);
      if (!metadata) {
        return null;
      }

      const filePath = path.join(this.uploadPath, metadata.filename);

      // Check if file exists
      try {
        await fs.access(filePath);
      } catch {
        logger.warn('Media file not found', { mediaId, filePath });
        return null;
      }

      const fs_sync = await import('fs');
      return fs_sync.createReadStream(filePath);

    } catch (error) {
      logger.error('Failed to get media stream', { mediaId, error });
      return null;
    }
  }

  // Private helper methods

  private generateFileId(): string {
    return crypto.randomBytes(16).toString('hex');
  }

  private isImage(mimeType: string): boolean {
    return mimeType.startsWith('image/');
  }

  // Metadata storage methods (in a real implementation, these would use a database)
  private async storeMetadata(metadata: MediaMetadata): Promise<void> {
    const metadataPath = path.join(this.uploadPath, `${metadata.id}.meta.json`);
    await fs.writeFile(metadataPath, JSON.stringify(metadata, null, 2));
  }

  private async getMetadataFromStorage(mediaId: string): Promise<MediaMetadata | null> {
    try {
      const metadataPath = path.join(this.uploadPath, `${mediaId}.meta.json`);
      const data = await fs.readFile(metadataPath, 'utf-8');
      const metadata = JSON.parse(data);
      
      // Convert date strings back to Date objects
      metadata.uploadedAt = new Date(metadata.uploadedAt);
      if (metadata.expiresAt) {
        metadata.expiresAt = new Date(metadata.expiresAt);
      }
      
      return metadata;
    } catch {
      return null;
    }
  }

  private async getAllMetadataFromStorage(): Promise<MediaMetadata[]> {
    try {
      const files = await fs.readdir(this.uploadPath);
      const metadataFiles = files.filter(file => file.endsWith('.meta.json'));
      
      const metadata: MediaMetadata[] = [];
      for (const file of metadataFiles) {
        const mediaId = file.replace('.meta.json', '');
        const meta = await this.getMetadataFromStorage(mediaId);
        if (meta) {
          metadata.push(meta);
        }
      }
      
      return metadata;
    } catch {
      return [];
    }
  }

  private async removeMetadata(mediaId: string): Promise<void> {
    try {
      const metadataPath = path.join(this.uploadPath, `${mediaId}.meta.json`);
      await fs.unlink(metadataPath);
    } catch {
      // Ignore errors - metadata might not exist
    }
  }
}

// Export singleton instance
export const mediaService = new MediaService();