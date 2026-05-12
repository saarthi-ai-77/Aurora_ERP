import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Reflector } from '@nestjs/core';
import { AuditLogService } from './audit-log.service';
import { AUDIT_ACTION_KEY } from './audit.decorator';
import { AuditAction } from '@prisma/client';

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  constructor(
    private reflector: Reflector,
    private auditLogService: AuditLogService,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const auditAction = this.reflector.get<AuditAction>(
      AUDIT_ACTION_KEY,
      context.getHandler(),
    );

    if (!auditAction) {
      return next.handle();
    }

    const req = context.switchToHttp().getRequest();
    const user = req.user;

    return next.handle().pipe(
      tap((data) => {
        // Run asynchronously without blocking response
        if (user) {
          // Attempt to extract entity ID from response or params
          const entityId = data?.id || req.params?.id || 'unknown';
          const entityType = req.path.split('/')[2] || 'unknown'; // naive extraction
          
          this.auditLogService.logAction(
            user.userId, // from JWT
            auditAction,
            entityType.toUpperCase(),
            entityId,
            req.body?.targetUserId || null,
            req.body,
          ).catch(() => {});
        }
      }),
    );
  }
}
