/**
 * Media Service
 * Handles file uploads, storage, and processing for images and documents
 */

import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { logger } from '../utils/logger';
import { metaApiService, MediaFile, MediaUploadResponse } from './metaApi';

// Media interfaces
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
    this.uploadPath = process.env.UPLOAD_PATH || path.join(process.cwd(), 'uploads');
    this.maxFileSize = parseInt(process.env.MAX_FILE_SIZE || '5242880'); // 5MB default
    this.allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp'];

    this.initializeDirectories();
  }

  private async initializeDirectories(): Promise<void> {
    try {
      if (!fs.existsSync(this.uploadPath)) {
        fs.mkdirSync(this.uploadPath, { recursive: true });
      }
    } catch (error) {
      logger.error('Failed to initialize media directories', { error });
    }
  }

  /**
   * Upload media file
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
      fs.copyFileSync(file.path, finalFilePath);
      fs.unlinkSync(file.path); // Remove temp file

      // Get file stats
      const stats = fs.statSync(finalFilePath);

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
          const fileBuffer = fs.readFileSync(finalFilePath);
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
        if (file.path && fs.existsSync(file.path)) {
          fs.unlinkSync(file.path);
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
   * Get all media
   */
  async getAllMedia(): Promise<MediaMetadata[]> {
    try {
      return await this.getAllMetadataFromStorage();
    } catch (error) {
      logger.error('Failed to get all media', { error });
      return [];
    }
  }

  /**
   * Delete media by ID
   */
  async deleteMedia(mediaId: string): Promise<boolean> {
    try {
      const metadata = await this.getMetadataFromStorage(mediaId);
      if (!metadata) {
        return false;
      }

      const filePath = path.join(this.uploadPath, metadata.filename);
      const metadataPath = path.join(this.uploadPath, `${mediaId}.meta.json`);

      // Delete file and metadata
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
      
      if (fs.existsSync(metadataPath)) {
        fs.unlinkSync(metadataPath);
      }

      logger.info('Media deleted', { mediaId });
      return true;
    } catch (error) {
      logger.error('Failed to delete media', { mediaId, error });
      return false;
    }
  }

  /**
   * Get media file stream
   */
  getMediaStream(mediaId: string): fs.ReadStream | null {
    try {
      const metadata = this.getMetadataFromStorageSync(mediaId);
      if (!metadata) {
        return null;
      }

      const filePath = path.join(this.uploadPath, metadata.filename);

      // Check if file exists
      if (!fs.existsSync(filePath)) {
        logger.warn('Media file not found', { mediaId, filePath });
        return null;
      }

      return fs.createReadStream(filePath);
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

  // Metadata storage methods
  private async storeMetadata(metadata: MediaMetadata): Promise<void> {
    const metadataPath = path.join(this.uploadPath, `${metadata.id}.meta.json`);
    fs.writeFileSync(metadataPath, JSON.stringify(metadata, null, 2));
  }

  private async getMetadataFromStorage(mediaId: string): Promise<MediaMetadata | null> {
    try {
      const metadataPath = path.join(this.uploadPath, `${mediaId}.meta.json`);
      if (!fs.existsSync(metadataPath)) {
        return null;
      }
      
      const data = fs.readFileSync(metadataPath, 'utf-8');
      const metadata = JSON.parse(data);
      
      // Convert date strings back to Date objects
      metadata.uploadedAt = new Date(metadata.uploadedAt);
      
      return metadata;
    } catch {
      return null;
    }
  }

  private getMetadataFromStorageSync(mediaId: string): MediaMetadata | null {
    try {
      const metadataPath = path.join(this.uploadPath, `${mediaId}.meta.json`);
      if (!fs.existsSync(metadataPath)) {
        return null;
      }
      
      const data = fs.readFileSync(metadataPath, 'utf-8');
      const metadata = JSON.parse(data);
      
      // Convert date strings back to Date objects
      metadata.uploadedAt = new Date(metadata.uploadedAt);
      
      return metadata;
    } catch {
      return null;
    }
  }

  private async getAllMetadataFromStorage(): Promise<MediaMetadata[]> {
    try {
      const files = fs.readdirSync(this.uploadPath);
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
}

// Export singleton instance
export const mediaService = new MediaService();