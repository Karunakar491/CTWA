import { Server as HTTPServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import jwt from 'jsonwebtoken';
import { logger } from '@/utils/logger';
import { corsOptions } from '@/config/cors';

interface AuthenticatedSocket extends Socket {
  userId?: string;
  userEmail?: string;
  userName?: string;
}

let io: SocketIOServer;

export function initializeWebSocket(server: HTTPServer): SocketIOServer {
  io = new SocketIOServer(server, {
    cors: {
      origin: corsOptions.origin,
      credentials: corsOptions.credentials,
    },
    transports: ['websocket', 'polling'],
  });

  // Authentication middleware
  io.use((socket: any, next) => {
    try {
      const token = socket.handshake.auth.token;
      
      if (!token) {
        return next(new Error('Authentication token required'));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
      socket.userId = decoded.id;
      socket.userEmail = decoded.email;
      socket.userName = decoded.name;
      
      logger.info('WebSocket user authenticated', {
        userId: decoded.id,
        email: decoded.email,
        socketId: socket.id,
      });
      
      next();
    } catch (error) {
      logger.error('WebSocket authentication failed:', error);
      next(new Error('Authentication failed'));
    }
  });

  io.on('connection', (socket: AuthenticatedSocket) => {
    logger.info('WebSocket client connected', {
      socketId: socket.id,
      userId: socket.userId,
      userEmail: socket.userEmail,
    });

    // Join user to their personal room
    if (socket.userId) {
      socket.join(`user:${socket.userId}`);
    }

    // Handle flow collaboration
    socket.on('join-flow', (flowId: string) => {
      socket.join(`flow:${flowId}`);
      socket.to(`flow:${flowId}`).emit('user-joined', {
        userId: socket.userId,
        userName: socket.userName,
        userEmail: socket.userEmail,
      });
      
      logger.debug('User joined flow collaboration', {
        userId: socket.userId,
        flowId,
        socketId: socket.id,
      });
    });

    socket.on('leave-flow', (flowId: string) => {
      socket.leave(`flow:${flowId}`);
      socket.to(`flow:${flowId}`).emit('user-left', {
        userId: socket.userId,
      });
      
      logger.debug('User left flow collaboration', {
        userId: socket.userId,
        flowId,
        socketId: socket.id,
      });
    });

    // Handle real-time flow changes
    socket.on('flow-change', (data: {
      flowId: string;
      change: any;
      timestamp: number;
    }) => {
      socket.to(`flow:${data.flowId}`).emit('flow-change', {
        ...data,
        userId: socket.userId,
        userName: socket.userName,
      });
      
      logger.debug('Flow change broadcasted', {
        userId: socket.userId,
        flowId: data.flowId,
        changeType: data.change.type,
      });
    });

    // Handle cursor position updates
    socket.on('cursor-update', (data: {
      flowId: string;
      position: { x: number; y: number };
    }) => {
      socket.to(`flow:${data.flowId}`).emit('cursor-update', {
        userId: socket.userId,
        userName: socket.userName,
        position: data.position,
      });
    });

    // Handle component locking
    socket.on('lock-component', (data: {
      flowId: string;
      componentId: string;
    }) => {
      socket.to(`flow:${data.flowId}`).emit('component-locked', {
        componentId: data.componentId,
        userId: socket.userId,
        userName: socket.userName,
      });
    });

    socket.on('unlock-component', (data: {
      flowId: string;
      componentId: string;
    }) => {
      socket.to(`flow:${data.flowId}`).emit('component-unlocked', {
        componentId: data.componentId,
        userId: socket.userId,
      });
    });

    // Handle disconnection
    socket.on('disconnect', (reason) => {
      logger.info('WebSocket client disconnected', {
        socketId: socket.id,
        userId: socket.userId,
        reason,
      });
    });

    // Handle errors
    socket.on('error', (error) => {
      logger.error('WebSocket error:', {
        socketId: socket.id,
        userId: socket.userId,
        error,
      });
    });
  });

  logger.info('WebSocket server initialized');
  return io;
}

export function getWebSocketServer(): SocketIOServer {
  if (!io) {
    throw new Error('WebSocket server not initialized');
  }
  return io;
}

// Utility functions for sending messages
export function sendToUser(userId: string, event: string, data: any): void {
  if (io) {
    io.to(`user:${userId}`).emit(event, data);
  }
}

export function sendToFlow(flowId: string, event: string, data: any): void {
  if (io) {
    io.to(`flow:${flowId}`).emit(event, data);
  }
}

export function broadcastToAll(event: string, data: any): void {
  if (io) {
    io.emit(event, data);
  }
}