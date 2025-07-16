import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { getPostgresPool } from '@/config/database';
import { AuthenticationError, ValidationError } from '@/middleware/errorHandler';
import { logger } from '@/utils/logger';

export interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  permissions: string[];
  isActive: boolean;
  emailVerified: boolean;
  lastLoginAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  name: string;
  password: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface JWTPayload {
  id: string;
  email: string;
  name: string;
  role: string;
  permissions: string[];
  type: 'access' | 'refresh';
}

export class AuthService {
  private readonly JWT_SECRET = process.env.JWT_SECRET!;
  private readonly JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET!;
  private readonly JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '15m';
  private readonly JWT_REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || '7d';
  private readonly BCRYPT_ROUNDS = parseInt(process.env.BCRYPT_ROUNDS || '12');

  async login(credentials: LoginCredentials): Promise<{ user: User; tokens: AuthTokens }> {
    const { email, password } = credentials;

    // Find user by email
    const pool = getPostgresPool();
    const result = await pool.query(
      'SELECT * FROM users WHERE email = $1 AND is_active = true',
      [email.toLowerCase()]
    );

    if (result.rows.length === 0) {
      throw new AuthenticationError('Invalid email or password');
    }

    const userRow = result.rows[0];

    // Verify password
    const isValidPassword = await bcrypt.compare(password, userRow.password_hash);
    if (!isValidPassword) {
      throw new AuthenticationError('Invalid email or password');
    }

    // Check if email is verified
    if (!userRow.email_verified) {
      throw new AuthenticationError('Please verify your email before logging in');
    }

    // Update last login
    await pool.query(
      'UPDATE users SET last_login_at = CURRENT_TIMESTAMP WHERE id = $1',
      [userRow.id]
    );

    const user: User = {
      id: userRow.id,
      email: userRow.email,
      name: userRow.name,
      role: userRow.role,
      permissions: userRow.permissions || [],
      isActive: userRow.is_active,
      emailVerified: userRow.email_verified,
      lastLoginAt: new Date(),
      createdAt: userRow.created_at,
      updatedAt: userRow.updated_at,
    };

    const tokens = this.generateTokens(user);

    logger.info('User logged in successfully', {
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    return { user, tokens };
  }

  async register(data: RegisterData): Promise<{ user: User; tokens: AuthTokens }> {
    const { email, name, password } = data;

    // Check if user already exists
    const pool = getPostgresPool();
    const existingUser = await pool.query(
      'SELECT id FROM users WHERE email = $1',
      [email.toLowerCase()]
    );

    if (existingUser.rows.length > 0) {
      throw new ValidationError('User with this email already exists');
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, this.BCRYPT_ROUNDS);

    // Create user
    const result = await pool.query(
      `INSERT INTO users (email, name, password_hash, role, permissions, is_active, email_verified)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [
        email.toLowerCase(),
        name,
        passwordHash,
        'user',
        ['flows:create', 'flows:read', 'flows:update', 'templates:read'],
        true,
        false, // Email verification required
      ]
    );

    const userRow = result.rows[0];
    const user: User = {
      id: userRow.id,
      email: userRow.email,
      name: userRow.name,
      role: userRow.role,
      permissions: userRow.permissions || [],
      isActive: userRow.is_active,
      emailVerified: userRow.email_verified,
      createdAt: userRow.created_at,
      updatedAt: userRow.updated_at,
    };

    const tokens = this.generateTokens(user);

    logger.info('User registered successfully', {
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    return { user, tokens };
  }

  async refreshToken(refreshToken: string): Promise<AuthTokens> {
    try {
      const decoded = jwt.verify(refreshToken, this.JWT_REFRESH_SECRET) as JWTPayload;

      if (decoded.type !== 'refresh') {
        throw new AuthenticationError('Invalid refresh token');
      }

      // Get current user data
      const pool = getPostgresPool();
      const result = await pool.query(
        'SELECT * FROM users WHERE id = $1 AND is_active = true',
        [decoded.id]
      );

      if (result.rows.length === 0) {
        throw new AuthenticationError('User not found or inactive');
      }

      const userRow = result.rows[0];
      const user: User = {
        id: userRow.id,
        email: userRow.email,
        name: userRow.name,
        role: userRow.role,
        permissions: userRow.permissions || [],
        isActive: userRow.is_active,
        emailVerified: userRow.email_verified,
        lastLoginAt: userRow.last_login_at,
        createdAt: userRow.created_at,
        updatedAt: userRow.updated_at,
      };

      return this.generateTokens(user);
    } catch (error) {
      if (error instanceof jwt.JsonWebTokenError) {
        throw new AuthenticationError('Invalid refresh token');
      }
      throw error;
    }
  }

  async getUserById(userId: string): Promise<User | null> {
    const pool = getPostgresPool();
    const result = await pool.query(
      'SELECT * FROM users WHERE id = $1 AND is_active = true',
      [userId]
    );

    if (result.rows.length === 0) {
      return null;
    }

    const userRow = result.rows[0];
    return {
      id: userRow.id,
      email: userRow.email,
      name: userRow.name,
      role: userRow.role,
      permissions: userRow.permissions || [],
      isActive: userRow.is_active,
      emailVerified: userRow.email_verified,
      lastLoginAt: userRow.last_login_at,
      createdAt: userRow.created_at,
      updatedAt: userRow.updated_at,
    };
  }

  async updateUserPermissions(userId: string, permissions: string[]): Promise<void> {
    const pool = getPostgresPool();
    await pool.query(
      'UPDATE users SET permissions = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
      [permissions, userId]
    );

    logger.info('User permissions updated', {
      userId,
      permissions,
    });
  }

  async changePassword(userId: string, currentPassword: string, newPassword: string): Promise<void> {
    const pool = getPostgresPool();
    const result = await pool.query(
      'SELECT password_hash FROM users WHERE id = $1',
      [userId]
    );

    if (result.rows.length === 0) {
      throw new AuthenticationError('User not found');
    }

    const isValidPassword = await bcrypt.compare(currentPassword, result.rows[0].password_hash);
    if (!isValidPassword) {
      throw new AuthenticationError('Current password is incorrect');
    }

    const newPasswordHash = await bcrypt.hash(newPassword, this.BCRYPT_ROUNDS);
    await pool.query(
      'UPDATE users SET password_hash = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
      [newPasswordHash, userId]
    );

    logger.info('User password changed', { userId });
  }

  private generateTokens(user: User): AuthTokens {
    const payload: Omit<JWTPayload, 'type'> = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      permissions: user.permissions,
    };

    const accessToken = jwt.sign(
      { ...payload, type: 'access' },
      this.JWT_SECRET,
      { expiresIn: this.JWT_EXPIRES_IN }
    );

    const refreshToken = jwt.sign(
      { ...payload, type: 'refresh' },
      this.JWT_REFRESH_SECRET,
      { expiresIn: this.JWT_REFRESH_EXPIRES_IN }
    );

    // Parse expiration time
    const expiresIn = this.parseExpirationTime(this.JWT_EXPIRES_IN);

    return {
      accessToken,
      refreshToken,
      expiresIn,
    };
  }

  private parseExpirationTime(expiration: string): number {
    const match = expiration.match(/^(\d+)([smhd])$/);
    if (!match) return 900; // Default 15 minutes

    const value = parseInt(match[1]);
    const unit = match[2];

    switch (unit) {
      case 's': return value;
      case 'm': return value * 60;
      case 'h': return value * 60 * 60;
      case 'd': return value * 60 * 60 * 24;
      default: return 900;
    }
  }
}

export const authService = new AuthService();