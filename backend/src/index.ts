import 'dotenv/config';
import { createServer } from 'http';
import app from './app';
import { logger } from '@/utils/logger';
import { connectDatabases } from '@/config/database';
import { initializeWebSocket } from '@/services/websocket';
import { startCronJobs } from '@/utils/cron';

const PORT = process.env.PORT || 3001;
const WS_PORT = process.env.WS_PORT || 3002;

async function startServer(): Promise<void> {
  try {
    // Connect to databases
    await connectDatabases();
    logger.info('Database connections established');

    // Create HTTP server
    const server = createServer(app);

    // Initialize WebSocket server
    const wsServer = initializeWebSocket(server);
    logger.info(`WebSocket server initialized on port ${WS_PORT}`);

    // Start cron jobs
    startCronJobs();
    logger.info('Cron jobs started');

    // Start HTTP server
    server.listen(PORT, () => {
      logger.info(`🚀 WhatsApp Flow Backend server running on port ${PORT}`);
      logger.info(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
      logger.info(`🔗 API Base URL: http://localhost:${PORT}/api/${process.env.API_VERSION || 'v1'}`);
    });

    // Graceful shutdown
    process.on('SIGTERM', () => {
      logger.info('SIGTERM received, shutting down gracefully');
      server.close(() => {
        logger.info('HTTP server closed');
        wsServer.close(() => {
          logger.info('WebSocket server closed');
          process.exit(0);
        });
      });
    });

    process.on('SIGINT', () => {
      logger.info('SIGINT received, shutting down gracefully');
      server.close(() => {
        logger.info('HTTP server closed');
        wsServer.close(() => {
          logger.info('WebSocket server closed');
          process.exit(0);
        });
      });
    });

  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  process.exit(1);
});

// Start the server
void startServer();