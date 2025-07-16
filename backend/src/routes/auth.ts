import { Router, Request, Response } from 'express';
import Joi from 'joi';
import { asyncHandler, ValidationError } from '@/middleware/errorHandler';
import { validateRequest } from '@/middleware/validation';
import { authMiddleware } from '@/middleware/auth';
import { authService } from '@/services/auth';
import { logger } from '@/utils/logger';

const router = Router();

// Validation schemas
const loginSchema = {
  body: Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().min(6).required(),
  }),
};

const registerSchema = {
  body: Joi.object({
    email: Joi.string().email().required(),
    name: Joi.string().min(2).max(100).required(),
    password: Joi.string().min(8).pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/).required()
      .messages({
        'string.pattern.base': 'Password must contain at least one lowercase letter, one uppercase letter, and one number'
      }),
  }),
};

const refreshSchema = {
  body: Joi.object({
    refreshToken: Joi.string().required(),
  }),
};

const changePasswordSchema = {
  body: Joi.object({
    currentPassword: Joi.string().required(),
    newPassword: Joi.string().min(8).pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/).required()
      .messages({
        'string.pattern.base': 'Password must contain at least one lowercase letter, one uppercase letter, and one number'
      }),
  }),
};

// Login endpoint
router.post('/login', validateRequest(loginSchema), asyncHandler(async (req: Request, res: Response) => {
  const { email, password } = req.body;

  const result = await authService.login({ email, password });

  res.json({
    success: true,
    message: 'Login successful',
    data: {
      user: {
        id: result.user.id,
        email: result.user.email,
        name: result.user.name,
        role: result.user.role,
        permissions: result.user.permissions,
        emailVerified: result.user.emailVerified,
      },
      tokens: result.tokens,
    },
  });
}));

// Register endpoint
router.post('/register', validateRequest(registerSchema), asyncHandler(async (req: Request, res: Response) => {
  const { email, name, password } = req.body;

  const result = await authService.register({ email, name, password });

  res.status(201).json({
    success: true,
    message: 'Registration successful. Please verify your email.',
    data: {
      user: {
        id: result.user.id,
        email: result.user.email,
        name: result.user.name,
        role: result.user.role,
        permissions: result.user.permissions,
        emailVerified: result.user.emailVerified,
      },
      tokens: result.tokens,
    },
  });
}));

// Refresh token endpoint
router.post('/refresh', validateRequest(refreshSchema), asyncHandler(async (req: Request, res: Response) => {
  const { refreshToken } = req.body;

  const tokens = await authService.refreshToken(refreshToken);

  res.json({
    success: true,
    message: 'Token refreshed successfully',
    data: {
      tokens,
    },
  });
}));

// Get current user profile
router.get('/me', authMiddleware, asyncHandler(async (req: Request, res: Response) => {
  const user = await authService.getUserById(req.user!.id);

  if (!user) {
    throw new ValidationError('User not found');
  }

  res.json({
    success: true,
    data: {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        permissions: user.permissions,
        emailVerified: user.emailVerified,
        lastLoginAt: user.lastLoginAt,
        createdAt: user.createdAt,
      },
    },
  });
}));

// Change password endpoint
router.post('/change-password', authMiddleware, validateRequest(changePasswordSchema), 
  asyncHandler(async (req: Request, res: Response) => {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user!.id;

    await authService.changePassword(userId, currentPassword, newPassword);

    res.json({
      success: true,
      message: 'Password changed successfully',
    });
  })
);

// Logout endpoint (client-side token removal)
router.post('/logout', authMiddleware, asyncHandler(async (req: Request, res: Response) => {
  logger.info('User logged out', {
    userId: req.user!.id,
    email: req.user!.email,
  });

  res.json({
    success: true,
    message: 'Logout successful',
  });
}));

export default router;