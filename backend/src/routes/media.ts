import { Router } from 'express';
import { asyncHandler } from '@/middleware/errorHandler';

const router = Router();

// TODO: Implement media upload routes
router.post('/upload', asyncHandler(async (req, res) => {
  res.json({ message: 'Upload media endpoint - TODO: Implement' });
}));

router.get('/:id', asyncHandler(async (req, res) => {
  res.json({ message: 'Get media by ID endpoint - TODO: Implement' });
}));

router.delete('/:id', asyncHandler(async (req, res) => {
  res.json({ message: 'Delete media endpoint - TODO: Implement' });
}));

export default router;