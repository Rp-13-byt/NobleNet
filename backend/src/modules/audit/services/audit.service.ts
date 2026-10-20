import { AuditLog } from '../models/AuditLog';
import { logger } from '../../../core/utils/logger';

export interface LogAuditParams {
  actorId?: string;
  actorRole?: string;
  action: string;
  targetType: string;
  targetId?: string;
  metadata?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
}

export class AuditService {
  static async log(params: LogAuditParams) {
    try {
      await AuditLog.create(params);
      logger.info({ action: params.action, targetType: params.targetType, targetId: params.targetId }, '[AUDIT]');
    } catch (err) {
      logger.error({ err }, '[AUDIT] Failed to write audit log');
    }
  }

  static async getLogs(page = 1, limit = 50, filters: Record<string, any> = {}) {
    const query: any = {};
    if (filters.action) query.action = filters.action;
    if (filters.resource) query.targetType = filters.resource;
    if (filters.targetType) query.targetType = filters.targetType;

    const skip = (page - 1) * limit;
    const [logs, total] = await Promise.all([
      AuditLog.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit),
      AuditLog.countDocuments(query),
    ]);
    return { data: logs, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } };
  }
}
