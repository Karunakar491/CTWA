import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import { rateLimit } from 'express-rate-limit';

import { logger, requestLogger } from '@/utils/logger';
import { errorHandler } from '@/middleware/errorHandler';
import { authMiddleware } from '@/middleware/auth';
import { validateRequest } from '@/middleware/validation';
import { securityHeaders, requestId, createIPRateLimit, requestSizeLimit } from '@/middleware/security';
import { corsOptions } from '@/config/cors';
import { rateLimitConfig } from '@/config/rateLimit';

// Import routes
import healthRoutes from '@/routes/health';
import authRoutes from '@/routes/auth';
import flowRoutes from '@/routes/flows';
import templateRoutes from '@/routes/templates';
import mediaRoutes from '@/routes/media';
import analyticsRoutes from '@/routes/analytics';
import webhookRoutes from '@/routes/webhooks';

const app = express();

// Trust proxy for accurate IP addresses
app.set('trust proxy', 1);

// Request ID middleware (first)
app.use(requestId);

// Security headers
app.use(securityHeaders);

// Helmet security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
  crossOriginEmbedderPolicy: false,
}));

// CORS configuration
app.use(cors(corsOptions));

// Compression middleware
app.use(compression());

// Request size limiting
app.use(requestSizeLimit(10 * 1024 * 1024)); // 10MB limit

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging
app.use(requestLogger);

// Global rate limiting (IP-based)
app.use(createIPRateLimit(15 * 60 * 1000, 1000)); // 1000 requests per 15 minutes per IP

// Express rate limiting (fallback)
app.use(rateLimit(rateLimitConfig));

// API routes
const API_VERSION = process.env.API_VERSION || 'v1';
const apiRouter = express.Router();

// Public routes (no authentication required)
apiRouter.use('/health', healthRoutes);
apiRouter.use('/auth', authRoutes);
apiRouter.use('/webhooks', webhookRoutes);

// Protected routes (authentication required)
apiRouter.use('/flows', authMiddleware, flowRoutes);
apiRouter.use('/templates', authMiddleware, templateRoutes);
apiRouter.use('/media', authMiddleware, mediaRoutes);
apiRouter.use('/analytics', authMiddleware, analyticsRoutes);

// Mount API routes
app.use(`/api/${API_VERSION}`, apiRouter);

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    name: 'WhatsApp Flow Backend',
    version: '1.0.0',
    status: 'running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    apiVersion: API_VERSION,
    endpoints: {
      health: `/api/${API_VERSION}/health`,
      auth: `/api/${API_VERSION}/auth`,
      flows: `/api/${API_VERSION}/flows`,
      templates: `/api/${API_VERSION}/templates`,
      media: `/api/${API_VERSION}/media`,
      analytics: `/api/${API_VERSION}/analytics`,
      webhooks: `/api/${API_VERSION}/webhooks`,
    },
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Route ${req.originalUrl} not found`,
    timestamp: new Date().toISOString(),
  });
});

// Global error handler
app.use(errorHandler);

export default app;