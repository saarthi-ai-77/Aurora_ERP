import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditAction } from '@prisma/client';

@Injectable()
export class AuditLogService {
  private readonly logger = new Logger(AuditLogService.name);

  constructor(private prisma: PrismaService) {}

  async logAction(
    actorId: string,
    action: AuditAction,
    entityType: string,
    entityId: string,
    targetUserId?: string,
    changes?: any,
  ) {
    try {
      await this.prisma.auditLog.create({
        data: {
          actorId,
          action,
          entityType,
          entityId,
          targetUserId,
          changes: (changes as any) || {},
        },
      });
    } catch (error) {
      this.logger.error(`Failed to create audit log for action ${action}`, error);
    }
  }
}
