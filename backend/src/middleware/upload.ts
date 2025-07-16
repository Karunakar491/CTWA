import multer from 'multer';
import path from 'path';
import { Request } from 'express';
import { ValidationError } from './errorHandler';

// File type validation
const allowedMimeTypes = (process.env.ALLOWED_FILE_TYPES || 'image/jpeg,image/png,image/webp,application/pdf').split(',');
const maxFileSize = parseInt(process.env.MAX_FILE_SIZE || '5242880'); // 5MB default

// Storage configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = process.env.UPLOAD_PATH || 'uploads';
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    // Generate unique filename
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, `${file.fieldname}-${uniqueSuffix}${ext}`);
  },
});

// File filter function
const fileFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  // Check file type
  if (!allowedMimeTypes.includes(file.mimetype)) {
    return cb(new ValidationError(`File type ${file.mimetype} not allowed. Allowed types: ${allowedMimeTypes.join(', ')}`));
  }

  // Additional security checks
  const ext = path.extname(file.originalname).toLowerCase();
  const allowedExtensions = ['.jpg', '.jpeg', '.png', '.webp', '.pdf'];
  
  if (!allowedExtensions.includes(ext)) {
    return cb(new ValidationError(`File extension ${ext} not allowed`));
  }

  cb(null, true);
};

// Create multer instance
export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: maxFileSize,
    files: 10, // Maximum 10 files per request
  },
});

// Middleware for single file upload
export const uploadSingle = (fieldName: string) => {
  return upload.single(fieldName);
};

// Middleware for multiple file upload
export const uploadMultiple = (fieldName: string, maxCount: number = 5) => {
  return upload.array(fieldName, maxCount);
};

// Middleware for mixed file upload
export const uploadFields = (fields: { name: string; maxCount?: number }[]) => {
  return upload.fields(fields);
};

// File validation middleware
export const validateUploadedFiles = (req: Request, res: any, next: any) => {
  const files = req.files as Express.Multer.File[] | { [fieldname: string]: Express.Multer.File[] };
  
  if (!files) {
    return next();
  }

  // Validate file sizes and types
  const filesToValidate: Express.Multer.File[] = Array.isArray(files) 
    ? files 
    : Object.values(files).flat();

  for (const file of filesToValidate) {
    // Additional virus scanning could be added here
    if (file.size > maxFileSize) {
      return next(new ValidationError(`File ${file.originalname} exceeds maximum size of ${maxFileSize} bytes`));
    }

    // Check for potentially dangerous file names
    if (file.originalname.includes('..') || file.originalname.includes('/') || file.originalname.includes('\\')) {
      return next(new ValidationError(`Invalid file name: ${file.originalname}`));
    }
  }

  next();
};

// Cleanup uploaded files on error
export const cleanupUploadedFiles = (req: Request) => {
  const files = req.files as Express.Multer.File[] | { [fieldname: string]: Express.Multer.File[] };
  
  if (!files) return;

  const filesToCleanup: Express.Multer.File[] = Array.isArray(files) 
    ? files 
    : Object.values(files).flat();

  // In a real implementation, you would delete the files from disk
  // For now, just log the cleanup action
  filesToCleanup.forEach(file => {
    console.log(`Cleaning up uploaded file: ${file.path}`);
    // fs.unlinkSync(file.path);
  });
};