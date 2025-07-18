import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';

export interface ApiError extends Error {
  statusCode?: number;
  details?: any;
}

export const errorHandler = (
  err: ApiError,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';
  const details = err.details || {};

  // Log the error
  logger.error(`Error: ${message}`, {
    statusCode,
    path: req.path,
    method: req.method,
    details,
    stack: err.stack
  });

  // Send response to client
  res.status(statusCode).json({
    error: {
      message,
      statusCode,
      path: req.path,
      timestamp: new Date().toISOString(),
      ...(process.env.NODE_ENV !== 'production' && { details })
    }
  });
};