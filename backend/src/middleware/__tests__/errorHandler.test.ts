import { Request, Response, NextFunction } from 'express';
import { 
  errorHandler, 
  ValidationError, 
  AuthenticationError, 
  AuthorizationError,
  NotFoundError,
  ConflictError,
  RateLimitError,
  MetaAPIError,
  asyncHandler 
} from '../errorHandler';

describe('Error Handler Middleware', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    mockRequest = {
      method: 'GET',
      originalUrl: '/test',
      correlationId: 'test-correlation-id',
      ip: '127.0.0.1',
      get: jest.fn().mockReturnValue('test-user-agent'),
    };

    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };

    mockNext = jest.fn();
  });

  describe('ValidationError', () => {
    it('should handle validation error correctly', () => {
      const error = new ValidationError('Validation failed', [
        { field: 'email', message: 'Invalid email' }
      ]);

      errorHandler(error, mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Validation failed',
          timestamp: expect.any(String),
          correlationId: 'test-correlation-id',
          validation: [{ field: 'email', message: 'Invalid email' }],
        },
      });
    });
  });

  describe('AuthenticationError', () => {
    it('should handle authentication error correctly', () => {
      const error = new AuthenticationError('Token expired');

      errorHandler(error, mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: {
          code: 'AUTHENTICATION_ERROR',
          message: 'Token expired',
          timestamp: expect.any(String),
          correlationId: 'test-correlation-id',
        },
      });
    });
  });

  describe('AuthorizationError', () => {
    it('should handle authorization error correctly', () => {
      const error = new AuthorizationError('Insufficient permissions');

      errorHandler(error, mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(403);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: {
          code: 'AUTHORIZATION_ERROR',
          message: 'Insufficient permissions',
          timestamp: expect.any(String),
          correlationId: 'test-correlation-id',
        },
      });
    });
  });

  describe('NotFoundError', () => {
    it('should handle not found error correctly', () => {
      const error = new NotFoundError('Resource not found');

      errorHandler(error, mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: {
          code: 'NOT_FOUND_ERROR',
          message: 'Resource not found',
          timestamp: expect.any(String),
          correlationId: 'test-correlation-id',
        },
      });
    });
  });

  describe('RateLimitError', () => {
    it('should handle rate limit error correctly', () => {
      const error = new RateLimitError('Too many requests');

      errorHandler(error, mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(429);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: {
          code: 'RATE_LIMIT_ERROR',
          message: 'Too many requests',
          timestamp: expect.any(String),
          correlationId: 'test-correlation-id',
        },
      });
    });
  });

  describe('MetaAPIError', () => {
    it('should handle Meta API error correctly', () => {
      const metaError = {
        error: {
          message: 'Invalid flow JSON',
          type: 'OAuthException',
          code: 190,
        },
      };
      const error = new MetaAPIError('Meta API request failed', metaError);

      errorHandler(error, mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(502);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: {
          code: 'META_API_ERROR',
          message: 'Meta API request failed',
          timestamp: expect.any(String),
          correlationId: 'test-correlation-id',
        },
      });
    });
  });

  describe('Generic Error', () => {
    it('should handle generic error correctly', () => {
      const error = new Error('Something went wrong');

      errorHandler(error, mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Something went wrong',
          timestamp: expect.any(String),
          correlationId: 'test-correlation-id',
        },
      });
    });
  });

  describe('asyncHandler', () => {
    it('should catch async errors and pass to next', async () => {
      const asyncFunction = async () => {
        throw new ValidationError('Async validation error');
      };

      const wrappedFunction = asyncHandler(asyncFunction);
      await wrappedFunction(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(ValidationError));
    });

    it('should handle successful async operations', async () => {
      const asyncFunction = async (req: Request, res: Response) => {
        res.json({ success: true });
      };

      const wrappedFunction = asyncHandler(asyncFunction);
      await wrappedFunction(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.json).toHaveBeenCalledWith({ success: true });
      expect(mockNext).not.toHaveBeenCalled();
    });
  });
});