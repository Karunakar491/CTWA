import express, { Request, Response } from 'express';
import cors from 'cors';
import path from 'path';

// Import routes
import flowsRoutes from './routes/flows';
import templatesRoutes from './routes/templates';
import mediaRoutes from './routes/media';
import webhooksRoutes from './routes/webhooks';
import dashboardRoutes from './routes/dashboard';

// Import middleware
import { errorHandler } from './middleware/errorHandler';
import { logger } from './utils/logger';

const app = express();

// Basic middleware
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:3000'], // Vite dev server and other common ports
  credentials: true
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging middleware
app.use((req: Request, res: Response, next) => {
  logger.info(`${req.method} ${req.path}`, {
    method: req.method,
    path: req.path,
    query: req.query,
    ip: req.ip
  });
  next();
});

// Serve uploaded files
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

// API routes
app.use('/api/flows', flowsRoutes);
app.use('/api/templates', templatesRoutes);
app.use('/api/media', mediaRoutes);
app.use('/api/webhooks', webhooksRoutes);
app.use('/api/dashboard', dashboardRoutes);

// Health check
app.get('/api/health', (req: Request, res: Response) => {
  res.json({ 
    success: true, 
    message: 'WhatsApp Flow Backend is running!',
    timestamp: new Date().toISOString()
  });
});

// Root endpoint
app.get('/', (req: Request, res: Response) => {
  res.json({
    name: 'WhatsApp Flow Backend',
    version: '1.0.0',
    status: 'running',
    timestamp: new Date().toISOString(),
    endpoints: {
      health: '/api/health',
      flows: '/api/flows',
      templates: '/api/templates',
      media: '/api/media',
    },
  });
});

// 404 handler
app.use('*', (req: Request, res: Response) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Route ${req.originalUrl} not found`,
    timestamp: new Date().toISOString(),
  });
});

// Global error handler
app.use(errorHandler);

export default app;