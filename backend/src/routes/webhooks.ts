import { Router } from 'express';
import { asyncHandler } from '@/middleware/errorHandler';

const router = Router();

// TODO: Implement webhook routes
router.get('/meta', asyncHandler(async (req, res) => {
  res.json({ message: 'Meta webhook verification endpoint - TODO: Implement' });
}));

router.post('/meta', asyncHandler(async (req, res) => {
  res.json({ message: 'Meta webhook handler endpoint - TODO: Implement' });
}));

export default router;