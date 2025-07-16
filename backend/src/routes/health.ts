import { Router, Request, Response } from 'express';
import { getPostgresPool, getMongoDb, getRedisClient, getElasticsearchClient } from '@/config/database';
import { logger } from '@/utils/logger';
import { asyncHandler } from '@/middleware/errorHandler';

const router = Router();

interface HealthCheck {
  status: 'healthy' | 'unhealthy';
  timestamp: string;
  uptime: number;
  version: string;
  environment: string;
  services: {
    database: ServiceHealth;
    mongodb: ServiceHealth;
    redis: ServiceHealth;
    elasticsearch: ServiceHealth;
  };
}

interface ServiceHealth {
  status: 'healthy' | 'unhealthy';
  responseTime?: number;
  error?: string;
}

const checkPostgres = async (): Promise<ServiceHealth> => {
  try {
    const start = Date.now();
    const pool = getPostgresPool();
    await pool.query('SELECT 1');
    const responseTime = Date.now() - start;
    return { status: 'healthy', responseTime };
  } catch (error) {
    return { 
      status: 'unhealthy', 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
};

const checkMongoDB = async (): Promise<ServiceHealth> => {
  try {
    const start = Date.now();
    const db = getMongoDb();
    await db.admin().ping();
    const responseTime = Date.now() - start;
    return { status: 'healthy', responseTime };
  } catch (error) {
    return { 
      status: 'unhealthy', 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
};

const checkRedis = async (): Promise<ServiceHealth> => {
  try {
    const start = Date.now();
    const client = getRedisClient();
    await client.ping();
    const responseTime = Date.now() - start;
    return { status: 'healthy', responseTime };
  } catch (error) {
    return { 
      status: 'unhealthy', 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
};

const checkElasticsearch = async (): Promise<ServiceHealth> => {
  try {
    const start = Date.now();
    const client = getElasticsearchClient();
    await client.ping();
    const responseTime = Date.now() - start;
    return { status: 'healthy', responseTime };
  } catch (error) {
    return { 
      status: 'unhealthy', 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
};

// Basic health check
router.get('/', asyncHandler(async (req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    message: 'WhatsApp Flow Backend is running',
  });
}));

// Detailed health check
router.get('/detailed', asyncHandler(async (req: Request, res: Response) => {
  const [database, mongodb, redis, elasticsearch] = await Promise.all([
    checkPostgres(),
    checkMongoDB(),
    checkRedis(),
    checkElasticsearch(),
  ]);

  const services = { database, mongodb, redis, elasticsearch };
  const allHealthy = Object.values(services).every(service => service.status === 'healthy');

  const healthCheck: HealthCheck = {
    status: allHealthy ? 'healthy' : 'unhealthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    services,
  };

  const statusCode = allHealthy ? 200 : 503;
  res.status(statusCode).json(healthCheck);

  if (!allHealthy) {
    logger.warn('Health check failed', { services });
  }
}));

// Readiness probe
router.get('/ready', asyncHandler(async (req: Request, res: Response) => {
  try {
    // Check if all critical services are available
    await Promise.all([
      checkPostgres(),
      checkMongoDB(),
      checkRedis(),
    ]);

    res.json({
      status: 'ready',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.status(503).json({
      status: 'not ready',
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}));

// Liveness probe
router.get('/live', asyncHandler(async (req: Request, res: Response) => {
  res.json({
    status: 'alive',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
}));

export default router;