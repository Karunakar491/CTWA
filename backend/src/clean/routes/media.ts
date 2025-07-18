import { Router, Request, Response, NextFunction } from 'express';
import multer from 'multer';
import path from 'path';
import { mediaService } from '../services/mediaService';
import { logger } from '../utils/logger';

// Configure multer for file uploads
const upload = multer({
  dest: 'uploads/temp/',
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB
  },
  fileFilter: (req, file, cb) => {
    const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp'];
    
    if (allowedMimeTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`Unsupported file type: ${file.mimetype}. Only JPEG, PNG, and WebP images are allowed.`));
    }
  }
});

const router = Router();

/**
 * @route POST /api/media/upload
 * @desc Upload media file
 * @access Public
 */
router.post('/upload', upload.single('file'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }

    const uploadToMeta = req.body.uploadToMeta === 'true';
    const result = await mediaService.uploadMedia(req.file, uploadToMeta);
    
    res.status(201).json({
      success: true,
      message: 'File uploaded successfully',
      data: {
        ...result.metadata,
        url: `/uploads/${result.metadata.filename}`
      }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route GET /api/media
 * @desc Get all media files
 * @access Public
 */
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const mediaFiles = await mediaService.getAllMedia();
    
    // Add URL to each media file
    const mediaWithUrls = mediaFiles.map(media => ({
      ...media,
      url: `/uploads/${media.filename}`
    }));
    
    res.json({
      success: true,
      data: mediaWithUrls
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route GET /api/media/:id
 * @desc Get media by ID
 * @access Public
 */
router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const media = await mediaService.getMedia(id);
    
    if (!media) {
      return res.status(404).json({
        success: false,
        message: `Media with ID ${id} not found`
      });
    }
    
    res.json({
      success: true,
      data: {
        ...media,
        url: `/uploads/${media.filename}`
      }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route DELETE /api/media/:id
 * @desc Delete media by ID
 * @access Public
 */
router.delete('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const deleted = await mediaService.deleteMedia(id);
    
    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: `Media with ID ${id} not found`
      });
    }
    
    res.json({
      success: true,
      message: `Media with ID ${id} deleted successfully`
    });
  } catch (error) {
    next(error);
  }
});

export default router;