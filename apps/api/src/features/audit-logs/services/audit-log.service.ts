import { logger } from '../../../config/logger';
import { AuditLog } from '../models/audit-log.model';

export interface LogAuditEventParams {
  tenantId?: string;
  actorId: string;
  action: string;
  targetType: string;
  targetId?: string;
  metadata?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
}

export async function logAuditEvent(params: LogAuditEventParams): Promise<void> {
  try {
    await AuditLog.create({
      tenantId: params.tenantId,
      actorId: params.actorId,
      action: params.action,
      targetType: params.targetType,
      targetId: params.targetId,
      metadata: params.metadata,
      ipAddress: params.ipAddress,
      userAgent: params.userAgent,
      timestamp: new Date(),
    });
    logger.info(`[AUDIT] ${params.action}`, {
      actorId: params.actorId,
      targetType: params.targetType,
      targetId: params.targetId,
    });
  } catch (error) {
    logger.error('Failed to log audit event', { error, params });
  }
}
