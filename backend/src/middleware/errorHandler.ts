import { Request, Response, NextFunction } from 'express';
import { logger } from '@/utils/logger';

export interface AppError extends Error {
  statusCode?: number;
  isOperational?: boolean;
  code?: string;
  details?: any;
  userMessage?: string;
  context?: Record<string, any>;
}

export class ValidationError extends Error {
  statusCode = 400;
  isOperational = true;
  code = 'VALIDATION_ERROR';

  constructor(message: string, public details?: any) {
    super(message);
    this.name = 'ValidationError';
  }
}

export class AuthenticationError extends Error {
  statusCode = 401;
  isOperational = true;
  code = 'AUTHENTICATION_ERROR';

  constructor(message = 'Authentication required') {
    super(message);
    this.name = 'AuthenticationError';
  }
}

export class AuthorizationError extends Error {
  statusCode = 403;
  isOperational = true;
  code = 'AUTHORIZATION_ERROR';

  constructor(message = 'Insufficient permissions') {
    super(message);
    this.name = 'AuthorizationError';
  }
}

export class NotFoundError extends Error {
  statusCode = 404;
  isOperational = true;
  code = 'NOT_FOUND_ERROR';

  constructor(message = 'Resource not found') {
    super(message);
    this.name = 'NotFoundError';
  }
}

export class ConflictError extends Error {
  statusCode = 409;
  isOperational = true;
  code = 'CONFLICT_ERROR';

  constructor(message = 'Resource conflict') {
    super(message);
    this.name = 'ConflictError';
  }
}

export class RateLimitError extends Error {
  statusCode = 429;
  isOperational = true;
  code = 'RATE_LIMIT_ERROR';

  constructor(message = 'Too many requests') {
    super(message);
    this.name = 'RateLimitError';
  }
}

export class MetaAPIError extends Error {
  statusCode = 502;
  isOperational = true;
  code = 'META_API_ERROR';

  constructor(message: string, public metaError?: any) {
    super(message);
    this.name = 'MetaAPIError';
  }
}

export class CircuitBreakerError extends Error {
  statusCode = 503;
  isOperational = true;
  code = 'CIRCUIT_BREAKER_OPEN';

  constructor(message = 'Service temporarily unavailable') {
    super(message);
    this.name = 'CircuitBreakerError';
  }
}

export class TimeoutError extends Error {
  statusCode = 408;
  isOperational = true;
  code = 'REQUEST_TIMEOUT';

  constructor(message = 'Request timeout') {
    super(message);
    this.name = 'TimeoutError';
  }
}

export class DatabaseError extends Error {
  statusCode = 500;
  isOperational = true;
  code = 'DATABASE_ERROR';

  constructor(message: string, public originalError?: any) {
    super(message);
    this.name = 'DatabaseError';
  }
}

export class ExternalServiceError extends Error {
  statusCode = 502;
  isOperational = true;
  code = 'EXTERNAL_SERVICE_ERROR';

  constructor(message: string, public service?: string, public originalError?: any) {
    super(message);
    this.name = 'ExternalServiceError';
  }
}

// Error message translations for user-friendly responses
const errorTranslations: Record<string, string> = {
  'VALIDATION_ERROR': 'The provided data is invalid. Please check your input and try again.',
  'AUTHENTICATION_ERROR': 'You need to be logged in to access this resource.',
  'AUTHORIZATION_ERROR': 'You don\'t have permission to perform this action.',
  'NOT_FOUND_ERROR': 'The requested resource could not be found.',
  'CONFLICT_ERROR': 'This action conflicts with existing data. Please check and try again.',
  'RATE_LIMIT_ERROR': 'Too many requests. Please wait a moment before trying again.',
  'META_API_ERROR': 'There was an issue communicating with WhatsApp services. Please try again later.',
  'CIRCUIT_BREAKER_OPEN': 'This service is temporarily unavailable. Please try again in a few minutes.',
  'REQUEST_TIMEOUT': 'The request took too long to complete. Please try again.',
  'DATABASE_ERROR': 'A database error occurred. Please try again later.',
  'EXTERNAL_SERVICE_ERROR': 'An external service is currently unavailable. Please try again later.',
  'INTERNAL_SERVER_ERROR': 'An unexpected error occurred. Please try again later.',
};

// Get user-friendly error message
const getUserFriendlyMessage = (error: AppError): string => {
  // Use custom user message if provided
  if (error.userMessage) {
    return error.userMessage;
  }

  // Use translation if available
  if (error.code && errorTranslations[error.code]) {
    return errorTranslations[error.code];
  }

  // Fall back to original message for development, generic message for production
  return process.env.NODE_ENV === 'development' 
    ? error.message 
    : 'An error occurred while processing your request.';
};

// Enhanced error context extraction
const extractErrorContext = (error: AppError, req: Request): Record<string, any> => {
  const context: Record<string, any> = {
    timestamp: new Date().toISOString(),
    correlationId: req.correlationId,
    method: req.method,
    url: req.originalUrl,
    userAgent: req.get('User-Agent'),
    ip: req.ip,
  };

  // Add user context if available
  if (req.user) {
    context.userId = req.user.id;
    context.userRole = req.user.role;
  }

  // Add error-specific context
  if (error.context) {
    context.errorContext = error.context;
  }

  // Add Meta API specific context
  if (error instanceof MetaAPIError && error.metaError) {
    context.metaApiError = {
      code: error.metaError.error?.code,
      type: error.metaError.error?.type,
      subcode: error.metaError.error?.error_subcode,
    };
  }

  // Add database error context
  if (error instanceof DatabaseError && error.originalError) {
    context.databaseError = {
      code: error.originalError.code,
      constraint: error.originalError.constraint,
      table: error.originalError.table,
    };
  }

  return context;
};

export const errorHandler = (
  error: AppError,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const {
    statusCode = 500,
    message,
    code = 'INTERNAL_SERVER_ERROR',
    details,
    stack,
  } = error;

  // Extract comprehensive error context
  const errorContext = extractErrorContext(error, req);

  // Log error details with structured logging
  const errorLog = {
    level: statusCode >= 500 ? 'error' : 'warn',
    error: {
      name: error.name,
      message,
      code,
      statusCode,
      stack: process.env.NODE_ENV === 'development' ? stack : undefined,
      details,
      isOperational: error.isOperational,
    },
    context: errorContext,
  };

  if (statusCode >= 500) {
    logger.error('Server Error', errorLog);
  } else {
    logger.warn('Client Error', errorLog);
  }

  // Get user-friendly message
  const userMessage = getUserFriendlyMessage(error);

  // Build error response
  const errorResponse: any = {
    success: false,
    error: {
      code,
      message: userMessage,
      timestamp: errorContext.timestamp,
      correlationId: errorContext.correlationId,
    },
  };

  // Include technical details in development
  if (process.env.NODE_ENV === 'development') {
    errorResponse.error.technical = {
      originalMessage: message,
      details,
      stack,
      context: errorContext.errorContext,
    };
  }

  // Include validation details for validation errors
  if (error instanceof ValidationError && details) {
    errorResponse.error.validation = details;
  }

  // Include retry information for temporary errors
  if (error instanceof CircuitBreakerError || error instanceof TimeoutError || error instanceof RateLimitError) {
    errorResponse.error.retryAfter = getRetryAfterSeconds(error);
    errorResponse.error.retryable = true;
  }

  res.status(statusCode).json(errorResponse);
};

// Calculate retry-after seconds based on error type
const getRetryAfterSeconds = (error: AppError): number => {
  if (error instanceof RateLimitError) {
    return 60; // 1 minute for rate limit
  }
  if (error instanceof CircuitBreakerError) {
    return 300; // 5 minutes for circuit breaker
  }
  if (error instanceof TimeoutError) {
    return 30; // 30 seconds for timeout
  }
  return 60; // Default 1 minute
};

// Async error wrapper
export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};