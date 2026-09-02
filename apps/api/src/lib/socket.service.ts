import { Server as SocketServer } from 'socket.io';
import type { Server as HttpServer } from 'node:http';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';

let ioServer: SocketServer | null = null;

export function initSocketServer(httpServer: HttpServer): SocketServer {
  ioServer = new SocketServer(httpServer, {
    cors: {
      origin: env.CLIENT_URL,
      credentials: true,
      methods: ['GET', 'POST'],
    },
  });

  ioServer.use((socket: any, next: (err?: Error) => void) => {
    const token =
      socket.handshake?.auth?.token ||
      socket.handshake?.headers?.authorization?.replace('Bearer ', '');

    if (!token) {
      return next(new Error('Authentication token missing'));
    }

    try {
      const decoded = jwt.verify(token, env.JWT_ACCESS_SECRET) as any;
      socket.user = {
        userId: decoded.sub || decoded.userId,
        tenantId: decoded.tenantId,
        roles: decoded.roles,
      };
      next();
    } catch {
      next(new Error('Invalid or expired token'));
    }
  });

  ioServer.on('connection', (socket: any) => {
    if (socket.user?.userId) {
      const userRoom = `user:${socket.user.userId}`;
      void socket.join(userRoom);
    }

    socket.on('join_branch_room', (branchId: string) => {
      if (branchId) {
        void socket.join(`branch:${branchId}`);
      }
    });

    socket.on('leave_branch_room', (branchId: string) => {
      if (branchId) {
        void socket.leave(`branch:${branchId}`);
      }
    });
  });

  return ioServer;
}

export function getSocketServer(): SocketServer | null {
  return ioServer;
}

export function emitToUserRoom(userId: string, event: string, payload: unknown) {
  if (ioServer) {
    ioServer.to(`user:${userId}`).emit(event, payload);
  }
}

export function emitToBranchRoom(branchId: string, event: string, payload: unknown) {
  if (ioServer) {
    ioServer.to(`branch:${branchId}`).emit(event, payload);
  }
}
