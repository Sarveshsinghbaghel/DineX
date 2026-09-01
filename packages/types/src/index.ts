export interface ApiResponseMeta {
  requestId: string;
  timestamp?: string;
}

export interface ApiSuccessResponse<TData> {
  success: true;
  message: string;
  data: TData;
  meta: ApiResponseMeta;
  pagination?: {
    nextCursor?: string;
    pageSize?: number;
    hasNextPage?: boolean;
  };
}

export interface ApiErrorDetail {
  field?: string;
  message: string;
  rule?: string;
}

export interface ApiErrorResponse {
  success: false;
  message: string;
  errorCode: string;
  errors: ApiErrorDetail[];
  timestamp: string;
  requestId: string;
}

export type ApiResponse<TData> = ApiSuccessResponse<TData> | ApiErrorResponse;

export interface HealthSnapshot {
  name: string;
  environment: string;
  version: string;
  timestamp: string;
  uptimeInSeconds: number;
  database: {
    status: 'connected' | 'connecting' | 'disconnected' | 'disconnecting';
  };
  memory: {
    rssInBytes: number;
    heapTotalInBytes: number;
    heapUsedInBytes: number;
  };
}

export type PermissionScope = 'own' | 'branch' | 'restaurant' | 'tenant' | 'platform';

export interface Permission {
  _id: string;
  code: string;
  module: string;
  action: string;
  scope: PermissionScope;
  status: 'active' | 'inactive';
  description?: string;
  isSystem: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface Role {
  _id: string;
  tenantId?: string;
  name: string;
  code: string;
  description?: string;
  permissionIds: string[];
  permissions?: Permission[];
  status: 'active' | 'inactive';
  isSystem: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface AuditLog {
  _id: string;
  tenantId?: string;
  actorId: string;
  action: string;
  targetType: string;
  targetId?: string;
  metadata?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
  timestamp: string;
}

export interface AuthorizationContext {
  userId: string;
  sessionId: string;
  tenantId?: string;
  branchIds?: string[];
  roles: Role[];
  permissions: string[];
}

