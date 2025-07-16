import { Request, Response, NextFunction } from 'express';
import { RateLimitError } from './errorHandler';
import { getRedisClient } from '@/config/database';
import { logger } from '@/utils/logger';

// IP-based rate limiting
export const createIPRateLimit = (windowMs: number, maxRequests: number) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const redis = getRedisClient();
      const key = `rate_limit:ip:${req.ip}`;
      
      const current = await redis.incr(key);
      
      if (current === 1) {
        await redis.expire(key, Math.ceil(windowMs / 1000));
      }
      
      if (current > maxRequests) {
        const ttl = await redis.ttl(key);
        res.set('Retry-After', ttl.toString());
        throw new RateLimitError(`Too many requests from IP ${req.ip}`);
      }
      
      // Add rate limit headers
      res.set({
        'X-RateLimit-Limit': maxRequests.toString(),
        'X-RateLimit-Remaining': Math.max(0, maxRequests - current).toString(),
        'X-RateLimit-Reset': new Date(Date.now() + (windowMs)).toISOString(),
      });
      
      next();
    } catch (error) {
      if (error instanceof RateLimitError) {
        throw error;
      }
      logger.error('Rate limiting error:', error);
      next(); // Continue on Redis errors
    }
  };
};

// User-based rate limiting
export const createUserRateLimit = (windowMs: number, maxRequests: number) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(); // Skip if not authenticated
    }
    
    try {
      const redis = getRedisClient();
      const key = `rate_limit:user:${req.user.id}`;
      
      const current = await redis.incr(key);
      
      if (current === 1) {
        await redis.expire(key, Math.ceil(windowMs / 1000));
      }
      
      if (current > maxRequests) {
        const ttl = await redis.ttl(key);
        res.set('Retry-After', ttl.toString());
        throw new RateLimitError(`Too many requests from user ${req.user.email}`);
      }
      
      // Add rate limit headers
      res.set({
        'X-RateLimit-User-Limit': maxRequests.toString(),
        'X-RateLimit-User-Remaining': Math.max(0, maxRequests - current).toString(),
        'X-RateLimit-User-Reset': new Date(Date.now() + (windowMs)).toISOString(),
      });
      
      next();
    } catch (error) {
      if (error instanceof RateLimitError) {
        throw error;
      }
      logger.error('User rate limiting error:', error);
      next(); // Continue on Redis errors
    }
  };
};

// Request size limiting
export const requestSizeLimit = (maxSize: number) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const contentLength = parseInt(req.get('content-length') || '0');
    
    if (contentLength > maxSize) {
      throw new RateLimitError(`Request size ${contentLength} exceeds limit of ${maxSize} bytes`);
    }
    
    next();
  };
};

// Security headers middleware
export const securityHeaders = (req: Request, res: Response, next: NextFunction) => {
  // Remove server information
  res.removeHeader('X-Powered-By');
  
  // Add security headers
  res.set({
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
  });
  
  next();
};

// Request ID middleware
export const requestId = (req: Request, res: Response, next: NextFunction) => {
  const existingId = req.get('X-Request-ID');
  const requestId = existingId || `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  req.requestId = requestId;
  res.set('X-Request-ID', requestId);
  
  next();
};

// Extend Express Request interface
declare global {
  namespace Express {
    interface Request {
      requestId?: string;
    }
  }
}