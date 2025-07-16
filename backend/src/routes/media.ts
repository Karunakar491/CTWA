import { Router, Request, Response } from 'express';
import { asyncHandler } from '@/middleware/errorHandler';
import { uploadSingle } from '@/middleware/upload';
import { mediaService } from '@/services/mediaService';
import { logger } from '@/utils/logger';

const router = Router();

// Simple media upload for flow images
router.post('/upload',
  uploadSingle('file'),
  asyncHandler(async (req: Request, res: Response) => {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }

    const { uploadToMeta = false } = req.body;

    try {
      const result = await mediaService.uploadMedia(req.file, uploadToMeta);

      logger.info('Media uploaded successfully', {
        mediaId: result.metadata.id,
        filename: req.file.originalname,
        size: req.file.size,
        uploadToMeta
      });

      res.status(201).json({
        success: true,
        message: 'Media uploaded successfully',
        data: {
          id: result.metadata.id,
          originalName: result.metadata.originalName,
          filename: result.metadata.filename,
          mimeType: result.metadata.mimeType,
          size: result.metadata.size,
          uploadedAt: result.metadata.uploadedAt,
          metaMediaId: result.metadata.metaMediaId,
          metaMediaUrl: result.metadata.metaMediaUrl,
          url: `/api/media/${result.metadata.id}`
        }
      });

    } catch (error) {
      logger.error('Media upload failed', {
        filename: req.file.originalname,
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      res.status(500).json({
        success: false,
        message: 'Media upload failed',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  })
);

// Get media by ID
router.get('/:id', asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  const media = await mediaService.getMedia(id);
  if (!media) {
    return res.status(404).json({
      success: false,
      message: 'Media not found'
    });
  }

  res.json({
    success: true,
    data: {
      id: media.id,
      originalName: media.originalName,
      filename: media.filename,
      mimeType: media.mimeType,
      size: media.size,
      uploadedAt: media.uploadedAt,
      metaMediaId: media.metaMediaId,
      metaMediaUrl: media.metaMediaUrl,
      url: `/api/media/${media.id}`
    }
  });
}));

// Serve media file
router.get('/:id/file', asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  const media = await mediaService.getMedia(id);
  if (!media) {
    return res.status(404).json({
      success: false,
      message: 'Media not found'
    });
  }

  const stream = await mediaService.getMediaStream(id);
  if (!stream) {
    return res.status(404).json({
      success: false,
      message: 'Media file not found'
    });
  }

  // Set appropriate headers
  res.setHeader('Content-Type', media.mimeType);
  res.setHeader('Content-Disposition', `inline; filename="${media.originalName}"`);
  res.setHeader('Cache-Control', 'public, max-age=31536000'); // 1 year cache

  stream.pipe(res);
}));

export default router;