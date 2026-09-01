import type { DatabaseStatus } from '../types/health.types';

export const mongooseConnectionStates: Record<number, DatabaseStatus> = {
  0: 'disconnected',
  1: 'connected',
  2: 'connecting',
  3: 'disconnecting',
};
