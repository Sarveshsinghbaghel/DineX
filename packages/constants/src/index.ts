export const APP_NAME = 'DineX Restaurant Management System';
export const API_PREFIX = '/api/v1';
export const HEALTH_ROUTE = '/health';
export const DEFAULT_PORTS = {
  api: 4000,
  web: 5173,
  worker: 4100,
} as const;
export const REQUEST_BODY_LIMIT = '1mb';

export * from './roles-permissions';
