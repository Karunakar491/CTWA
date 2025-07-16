import express from 'express';
import cors from 'cors';
import path from 'path';

// Import routes
import flowsRoutes from '@/routes/flows';
import templatesRoutes from '@/routes/templates';
import mediaRoutes from '@/routes/media';

// Import middleware
import { errorHandler } from '@/middleware/errorHandler';

const app = express();

// Basic middleware
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:3000'], // Vite dev server and other common ports
  credentials: true
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Serve uploaded files
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

// API routes
app.use('/api/flows', flowsRoutes);
app.use('/api/templates', templatesRoutes);
app.use('/api/media', mediaRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    success: true, 
    message: 'WhatsApp Flow Backend is running!',
    timestamp: new Date().toISOString()
  });
});

// Root endpoint
app.get('/', (req, res) => {
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