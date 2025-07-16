import { AuthService } from '../auth';
import { getPostgresPool } from '@/config/database';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

// Mock dependencies
jest.mock('@/config/database');
jest.mock('bcryptjs');
jest.mock('jsonwebtoken');

const mockPool = {
  query: jest.fn(),
};

const mockBcrypt = bcrypt as jest.Mocked<typeof bcrypt>;
const mockJwt = jwt as jest.Mocked<typeof jwt>;

describe('AuthService', () => {
  let authService: AuthService;

  beforeEach(() => {
    authService = new AuthService();
    (getPostgresPool as jest.Mock).mockReturnValue(mockPool);
    jest.clearAllMocks();
  });

  describe('login', () => {
    const mockUser = {
      id: 'user-123',
      email: 'test@example.com',
      name: 'Test User',
      password_hash: 'hashed-password',
      role: 'user',
      permissions: ['flows:read'],
      is_active: true,
      email_verified: true,
      created_at: new Date(),
      updated_at: new Date(),
    };

    it('should login successfully with valid credentials', async () => {
      mockPool.query
        .mockResolvedValueOnce({ rows: [mockUser] }) // Find user
        .mockResolvedValueOnce({ rows: [] }); // Update last login

      mockBcrypt.compare.mockResolvedValue(true);
      mockJwt.sign
        .mockReturnValueOnce('access-token')
        .mockReturnValueOnce('refresh-token');

      const result = await authService.login({
        email: 'test@example.com',
        password: 'password123',
      });

      expect(result.user.email).toBe('test@example.com');
      expect(result.tokens.accessToken).toBe('access-token');
      expect(result.tokens.refreshToken).toBe('refresh-token');
    });

    it('should throw error for invalid email', async () => {
      mockPool.query.mockResolvedValueOnce({ rows: [] });

      await expect(
        authService.login({
          email: 'invalid@example.com',
          password: 'password123',
        })
      ).rejects.toThrow('Invalid email or password');
    });

    it('should throw error for invalid password', async () => {
      mockPool.query.mockResolvedValueOnce({ rows: [mockUser] });
      mockBcrypt.compare.mockResolvedValue(false);

      await expect(
        authService.login({
          email: 'test@example.com',
          password: 'wrongpassword',
        })
      ).rejects.toThrow('Invalid email or password');
    });

    it('should throw error for unverified email', async () => {
      const unverifiedUser = { ...mockUser, email_verified: false };
      mockPool.query.mockResolvedValueOnce({ rows: [unverifiedUser] });
      mockBcrypt.compare.mockResolvedValue(true);

      await expect(
        authService.login({
          email: 'test@example.com',
          password: 'password123',
        })
      ).rejects.toThrow('Please verify your email before logging in');
    });
  });

  describe('register', () => {
    it('should register new user successfully', async () => {
      const newUser = {
        id: 'user-456',
        email: 'newuser@example.com',
        name: 'New User',
        password_hash: 'hashed-password',
        role: 'user',
        permissions: ['flows:create', 'flows:read', 'flows:update', 'templates:read'],
        is_active: true,
        email_verified: false,
        created_at: new Date(),
        updated_at: new Date(),
      };

      mockPool.query
        .mockResolvedValueOnce({ rows: [] }) // Check existing user
        .mockResolvedValueOnce({ rows: [newUser] }); // Create user

      mockBcrypt.hash.mockResolvedValue('hashed-password');
      mockJwt.sign
        .mockReturnValueOnce('access-token')
        .mockReturnValueOnce('refresh-token');

      const result = await authService.register({
        email: 'newuser@example.com',
        name: 'New User',
        password: 'Password123',
      });

      expect(result.user.email).toBe('newuser@example.com');
      expect(result.user.emailVerified).toBe(false);
      expect(result.tokens.accessToken).toBe('access-token');
    });

    it('should throw error for existing email', async () => {
      mockPool.query.mockResolvedValueOnce({ rows: [{ id: 'existing-user' }] });

      await expect(
        authService.register({
          email: 'existing@example.com',
          name: 'Test User',
          password: 'Password123',
        })
      ).rejects.toThrow('User with this email already exists');
    });
  });

  describe('refreshToken', () => {
    it('should refresh token successfully', async () => {
      const mockDecoded = {
        id: 'user-123',
        email: 'test@example.com',
        name: 'Test User',
        role: 'user',
        permissions: ['flows:read'],
        type: 'refresh',
      };

      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        name: 'Test User',
        role: 'user',
        permissions: ['flows:read'],
        is_active: true,
        email_verified: true,
        created_at: new Date(),
        updated_at: new Date(),
      };

      mockJwt.verify.mockReturnValue(mockDecoded);
      mockPool.query.mockResolvedValueOnce({ rows: [mockUser] });
      mockJwt.sign
        .mockReturnValueOnce('new-access-token')
        .mockReturnValueOnce('new-refresh-token');

      const result = await authService.refreshToken('valid-refresh-token');

      expect(result.accessToken).toBe('new-access-token');
      expect(result.refreshToken).toBe('new-refresh-token');
    });

    it('should throw error for invalid refresh token', async () => {
      mockJwt.verify.mockImplementation(() => {
        throw new jwt.JsonWebTokenError('Invalid token');
      });

      await expect(
        authService.refreshToken('invalid-token')
      ).rejects.toThrow('Invalid refresh token');
    });
  });

  describe('changePassword', () => {
    it('should change password successfully', async () => {
      mockPool.query
        .mockResolvedValueOnce({ rows: [{ password_hash: 'old-hash' }] }) // Get current password
        .mockResolvedValueOnce({ rows: [] }); // Update password

      mockBcrypt.compare.mockResolvedValue(true);
      mockBcrypt.hash.mockResolvedValue('new-hash');

      await authService.changePassword('user-123', 'oldPassword', 'newPassword123');

      expect(mockPool.query).toHaveBeenCalledWith(
        'UPDATE users SET password_hash = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
        ['new-hash', 'user-123']
      );
    });

    it('should throw error for incorrect current password', async () => {
      mockPool.query.mockResolvedValueOnce({ rows: [{ password_hash: 'old-hash' }] });
      mockBcrypt.compare.mockResolvedValue(false);

      await expect(
        authService.changePassword('user-123', 'wrongPassword', 'newPassword123')
      ).rejects.toThrow('Current password is incorrect');
    });
  });
});